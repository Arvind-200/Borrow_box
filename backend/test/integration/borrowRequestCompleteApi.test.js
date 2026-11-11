import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { BorrowRequest } from '../../src/models/BorrowRequest.js'
import { Product } from '../../src/models/Product.js'
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

function completeRequest(requestId, user) {
  return apiRequest(
    serverContext.baseUrl,
    `/api/borrow-requests/${requestId}/complete`,
    { method: 'PATCH', cookie: user ? authCookie(user) : undefined }
  )
}

async function createAcceptedRequest(owner, borrower, product) {
  return BorrowRequest.create({
    product: product._id,
    owner: owner._id,
    borrower: borrower._id,
    startDate: '2026-11-10',
    endDate: '2026-11-12',
    status: 'Accepted',
    decidedAt: new Date(),
    decidedBy: owner._id,
    decisionSource: 'owner',
  })
}

it('requires authentication to mark a request as returned', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const product = await createProduct({ owner, availability: 'unavailable' })
  const request = await createAcceptedRequest(owner, borrower, product)

  const { response } = await completeRequest(request._id)

  assert.equal(response.status, 401)
})

it('only lets the listing owner mark the request as returned', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const product = await createProduct({ owner, availability: 'unavailable' })
  const request = await createAcceptedRequest(owner, borrower, product)

  const { response } = await completeRequest(request._id, borrower)

  assert.equal(response.status, 403)
})

it('rejects completing a request that is not accepted', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const product = await createProduct({ owner })
  const request = await BorrowRequest.create({
    product: product._id,
    owner: owner._id,
    borrower: borrower._id,
    startDate: '2026-11-10',
    endDate: '2026-11-12',
    status: 'Pending',
  })

  const { response, data } = await completeRequest(request._id, owner)

  assert.equal(response.status, 409)
  assert.match(data.message, /only accepted requests/i)
})

it('rejects completing a request that is already completed', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const product = await createProduct({ owner })
  const request = await createAcceptedRequest(owner, borrower, product)

  await completeRequest(request._id, owner)
  const { response } = await completeRequest(request._id, owner)

  assert.equal(response.status, 409)
})

it('completes an accepted request and releases the product', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const product = await createProduct({ owner, availability: 'unavailable' })
  const request = await createAcceptedRequest(owner, borrower, product)

  const { response, data } = await completeRequest(request._id, owner)

  assert.equal(response.status, 200)
  assert.equal(data.request.status, 'Completed')
  assert.ok(data.request.completedAt)

  const stored = await BorrowRequest.findById(request._id).lean()
  assert.equal(stored.status, 'Completed')
  assert.ok(stored.completedAt)
  assert.equal(String(stored.completedBy), String(owner._id))

  const storedProduct = await Product.findById(product._id).lean()
  assert.equal(storedProduct.availability, 'available')
})

it('fails closed when transactions are unavailable', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const product = await createProduct({ owner, availability: 'unavailable' })
  const request = await createAcceptedRequest(owner, borrower, product)

  setTransactionSupportForTests(false)
  try {
    const { response } = await completeRequest(request._id, owner)
    assert.equal(response.status, 503)
  } finally {
    setTransactionSupportForTests(null)
  }

  const stored = await BorrowRequest.findById(request._id).lean()
  assert.equal(stored.status, 'Accepted')
  const storedProduct = await Product.findById(product._id).lean()
  assert.equal(storedProduct.availability, 'unavailable')
})
