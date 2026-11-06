import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import { BorrowRequest } from '../../src/models/BorrowRequest.js'
import { Product } from '../../src/models/Product.js'
import { reconcileBorrowAvailability } from '../../src/services/borrowRequestService.js'
import { setTransactionSupportForTests } from '../../src/utils/transactions.js'
import {
  integrationTestsEnabled,
  connectTestDb,
  clearTestDb,
  disconnectTestDb,
} from './helpers/testDb.js'
import {
  startTestServer,
  stopTestServer,
  createUser,
  authCookie,
  createProduct,
  apiRequest,
} from './helpers/testApi.js'

const enabled = integrationTestsEnabled()
const originalConsoleError = console.error

let serverContext = null

function it(name, fn) {
  test(name, { skip: !enabled }, fn)
}

before(async () => {
  if (!enabled) return

  console.error = () => {}
  await connectTestDb()
  serverContext = await startTestServer()
})

after(async () => {
  if (!enabled) return

  await stopTestServer(serverContext?.server)
  await disconnectTestDb()
  console.error = originalConsoleError
})

beforeEach(async () => {
  if (enabled) await clearTestDb()
})

function createPayload(productId, overrides = {}) {
  return {
    product: String(productId),
    startDate: '2026-11-10',
    endDate: '2026-11-12',
    message: 'Please include the carry case.',
    ...overrides,
  }
}

function productPayload(product, overrides = {}) {
  return {
    title: product.title,
    description: product.description,
    category: String(product.category),
    rentPerDay: product.rentPerDay,
    location: product.location,
    availability: product.availability,
    condition: product.condition,
    tags: product.tags,
    ...overrides,
  }
}

async function createPendingRequest(owner, borrower, product) {
  const { response, data } = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests',
    {
      method: 'POST',
      cookie: authCookie(borrower),
      payload: createPayload(product._id),
    }
  )

  assert.equal(response.status, 201)
  assert.equal(data.request.owner.id, String(owner._id))
  return data.request
}

async function acceptRequest(owner, requestId) {
  return apiRequest(
    serverContext.baseUrl,
    `/api/borrow-requests/${requestId}/accept`,
    {
      method: 'PATCH',
      cookie: authCookie(owner),
    }
  )
}

async function rejectRequest(owner, requestId) {
  return apiRequest(
    serverContext.baseUrl,
    `/api/borrow-requests/${requestId}/reject`,
    {
      method: 'PATCH',
      cookie: authCookie(owner),
    }
  )
}

async function cancelRequest(borrower, requestId) {
  return apiRequest(
    serverContext.baseUrl,
    `/api/borrow-requests/${requestId}/cancel`,
    {
      method: 'PATCH',
      cookie: authCookie(borrower),
    }
  )
}

it('accepts a pending request and reserves the product', async () => {
  const owner = await createUser({ name: 'Owner One' })
  const borrower = await createUser({ name: 'Borrower One' })
  const product = await createProduct({ owner })
  const request = await createPendingRequest(owner, borrower, product)

  const { response, data } = await acceptRequest(owner, request.id)

  assert.equal(response.status, 200)
  assert.equal(data.request.status, 'Accepted')
  assert.equal(data.request.decisionSource, 'owner')
  assert.ok(data.request.decidedAt)
  assert.equal(data.request.cancelledAt, null)
  assert.equal(data.request.borrower.id, String(borrower._id))
  assert.equal(data.request.owner.id, String(owner._id))
  assert.equal(data.request.borrower.email, undefined)
  assert.equal(data.request.owner.email, undefined)
  assert.equal(JSON.stringify(data).includes('passwordHash'), false)

  const storedRequest = await BorrowRequest.findById(request.id).lean()
  assert.equal(storedRequest.status, 'Accepted')
  assert.equal(String(storedRequest.decidedBy), String(owner._id))
  assert.equal(storedRequest.decisionSource, 'owner')

  const storedProduct = await Product.findById(product._id).lean()
  assert.equal(storedProduct.availability, 'unavailable')
})

it('blocks accept from non-owners, invalid ids, and missing requests', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const otherUser = await createUser()
  const product = await createProduct({ owner })
  const request = await createPendingRequest(owner, borrower, product)

  const otherAttempt = await acceptRequest(otherUser, request.id)
  assert.equal(otherAttempt.response.status, 403)

  const borrowerAttempt = await acceptRequest(borrower, request.id)
  assert.equal(borrowerAttempt.response.status, 403)

  const invalidAttempt = await acceptRequest(owner, 'not-an-object-id')
  assert.equal(invalidAttempt.response.status, 400)

  const missingAttempt = await acceptRequest(
    owner,
    new mongoose.Types.ObjectId()
  )
  assert.equal(missingAttempt.response.status, 404)

  const storedRequest = await BorrowRequest.findById(request.id).lean()
  assert.equal(storedRequest.status, 'Pending')
  const storedProduct = await Product.findById(product._id).lean()
  assert.equal(storedProduct.availability, 'available')
})

it('blocks accept when the product is unavailable or not public', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const product = await createProduct({ owner })
  const request = await createPendingRequest(owner, borrower, product)

  await Product.updateOne(
    { _id: product._id },
    { $set: { availability: 'unavailable' } }
  )
  const unavailable = await acceptRequest(owner, request.id)
  assert.equal(unavailable.response.status, 409)
  assert.match(unavailable.data.message, /currently unavailable/)

  await Product.updateOne(
    { _id: product._id },
    { $set: { availability: 'available', isPublished: false } }
  )
  const unpublished = await acceptRequest(owner, request.id)
  assert.equal(unpublished.response.status, 409)

  await Product.updateOne(
    { _id: product._id },
    { $set: { isPublished: true, moderationStatus: 'hidden' } }
  )
  const hidden = await acceptRequest(owner, request.id)
  assert.equal(hidden.response.status, 409)

  await Product.updateOne(
    { _id: product._id },
    { $set: { moderationStatus: 'active' } }
  )
  await Product.deleteOne({ _id: product._id })
  const missingProduct = await acceptRequest(owner, request.id)
  assert.equal(missingProduct.response.status, 409)

  const storedRequest = await BorrowRequest.findById(request.id).lean()
  assert.equal(storedRequest.status, 'Pending')
})

it('rejects a pending request without changing product availability', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const product = await createProduct({ owner })
  const request = await createPendingRequest(owner, borrower, product)

  const { response, data } = await rejectRequest(owner, request.id)

  assert.equal(response.status, 200)
  assert.equal(data.request.status, 'Rejected')
  assert.equal(data.request.decisionSource, 'owner')
  assert.ok(data.request.decidedAt)

  const storedRequest = await BorrowRequest.findById(request.id).lean()
  assert.equal(String(storedRequest.decidedBy), String(owner._id))
  assert.equal(storedRequest.status, 'Rejected')

  const storedProduct = await Product.findById(product._id).lean()
  assert.equal(storedProduct.availability, 'available')

  const repeat = await rejectRequest(owner, request.id)
  assert.equal(repeat.response.status, 409)
})

it('blocks reject from non-owners', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const otherUser = await createUser()
  const product = await createProduct({ owner })
  const request = await createPendingRequest(owner, borrower, product)

  const otherAttempt = await rejectRequest(otherUser, request.id)
  assert.equal(otherAttempt.response.status, 403)

  const borrowerAttempt = await rejectRequest(borrower, request.id)
  assert.equal(borrowerAttempt.response.status, 403)

  const storedRequest = await BorrowRequest.findById(request.id).lean()
  assert.equal(storedRequest.status, 'Pending')
})

it('cancels a pending request without changing product availability', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const otherUser = await createUser()
  const product = await createProduct({ owner })
  const request = await createPendingRequest(owner, borrower, product)

  const otherAttempt = await cancelRequest(otherUser, request.id)
  assert.equal(otherAttempt.response.status, 403)

  const { response, data } = await cancelRequest(borrower, request.id)

  assert.equal(response.status, 200)
  assert.equal(data.request.status, 'Cancelled')
  assert.ok(data.request.cancelledAt)

  const storedRequest = await BorrowRequest.findById(request.id).lean()
  assert.equal(String(storedRequest.cancelledBy), String(borrower._id))
  assert.equal(storedRequest.status, 'Cancelled')

  const storedProduct = await Product.findById(product._id).lean()
  assert.equal(storedProduct.availability, 'available')

  const repeat = await cancelRequest(borrower, request.id)
  assert.equal(repeat.response.status, 409)
})

it('cancels an accepted request and releases the product', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const product = await createProduct({ owner })
  const request = await createPendingRequest(owner, borrower, product)

  const accepted = await acceptRequest(owner, request.id)
  assert.equal(accepted.response.status, 200)

  const ownerAttempt = await cancelRequest(owner, request.id)
  assert.equal(ownerAttempt.response.status, 403)

  const { response, data } = await cancelRequest(borrower, request.id)

  assert.equal(response.status, 200)
  assert.equal(data.request.status, 'Cancelled')
  assert.equal(data.request.decisionSource, 'owner')
  assert.ok(data.request.decidedAt)
  assert.ok(data.request.cancelledAt)

  const storedProduct = await Product.findById(product._id).lean()
  assert.equal(storedProduct.availability, 'available')

  const storedRequest = await BorrowRequest.findById(request.id).lean()
  assert.equal(storedRequest.status, 'Cancelled')
  assert.equal(String(storedRequest.cancelledBy), String(borrower._id))
})

it('prevents reopening an accepted product until the request is cancelled', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const product = await createProduct({ owner })
  const request = await createPendingRequest(owner, borrower, product)

  const accepted = await acceptRequest(owner, request.id)
  assert.equal(accepted.response.status, 200)

  const reopen = await apiRequest(
    serverContext.baseUrl,
    `/api/products/${product._id}`,
    {
      method: 'PUT',
      cookie: authCookie(owner),
      payload: productPayload(product, { availability: 'available' }),
    }
  )
  assert.equal(reopen.response.status, 409)

  const unavailableEdit = await apiRequest(
    serverContext.baseUrl,
    `/api/products/${product._id}`,
    {
      method: 'PUT',
      cookie: authCookie(owner),
      payload: productPayload(product, {
        availability: 'unavailable',
        title: 'Updated While Reserved',
      }),
    }
  )
  assert.equal(unavailableEdit.response.status, 200)
  assert.equal(unavailableEdit.data.product.title, 'Updated While Reserved')

  const storedProduct = await Product.findById(product._id).lean()
  assert.equal(storedProduct.availability, 'unavailable')

  const cancelled = await cancelRequest(borrower, request.id)
  assert.equal(cancelled.response.status, 200)

  const reopened = await apiRequest(
    serverContext.baseUrl,
    `/api/products/${product._id}`,
    {
      method: 'PUT',
      cookie: authCookie(owner),
      payload: productPayload(product, { availability: 'available' }),
    }
  )
  assert.equal(reopened.response.status, 200)
  assert.equal(reopened.data.product.availability, 'available')
})

it('reconciles accepted products without reopening manual unavailability', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const acceptedProduct = await createProduct({ owner })
  const manualProduct = await createProduct({
    owner,
    availability: 'unavailable',
  })
  const request = await createPendingRequest(owner, borrower, acceptedProduct)

  const accepted = await acceptRequest(owner, request.id)
  assert.equal(accepted.response.status, 200)

  await Product.updateOne(
    { _id: acceptedProduct._id },
    { $set: { availability: 'available' } }
  )

  const result = await reconcileBorrowAvailability()
  assert.equal(result.acceptedRequests, 1)
  assert.equal(result.productsUpdated, 1)

  const storedAccepted = await Product.findById(acceptedProduct._id).lean()
  assert.equal(storedAccepted.availability, 'unavailable')

  const storedManual = await Product.findById(manualProduct._id).lean()
  assert.equal(storedManual.availability, 'unavailable')
})

it('fails closed for accept and cancel when transactions are unavailable', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const product = await createProduct({ owner })
  const request = await createPendingRequest(owner, borrower, product)

  setTransactionSupportForTests(false)
  try {
    const acceptAttempt = await acceptRequest(owner, request.id)
    assert.equal(acceptAttempt.response.status, 503)

    const cancelAttempt = await cancelRequest(borrower, request.id)
    assert.equal(cancelAttempt.response.status, 503)

    const rejectAttempt = await rejectRequest(owner, request.id)
    assert.equal(rejectAttempt.response.status, 200)
  } finally {
    setTransactionSupportForTests(null)
  }

  const storedProduct = await Product.findById(product._id).lean()
  assert.equal(storedProduct.availability, 'available')
})
