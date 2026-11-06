import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import { BorrowRequest } from '../../src/models/BorrowRequest.js'
import { Product } from '../../src/models/Product.js'
import { borrowRequestCreateLimiter } from '../../src/middleware/rateLimiters.js'
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
  createCategory,
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

it('creates a request with server-derived borrower and owner', async () => {
  const owner = await createUser({ name: 'Owner One' })
  const borrower = await createUser({ name: 'Borrower One' })
  const otherUser = await createUser({ name: 'Other User' })
  const product = await createProduct({ owner })

  const { response, data } = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests',
    {
      method: 'POST',
      cookie: authCookie(borrower),
      payload: {
        ...createPayload(product._id, {
          message: '  Please include the carry case.  ',
        }),
        owner: String(otherUser._id),
        borrower: String(otherUser._id),
        status: 'Accepted',
        decidedBy: String(otherUser._id),
      },
    }
  )

  assert.equal(response.status, 201)
  assert.equal(data.request.status, 'Pending')
  assert.equal(data.request.startDate, '2026-11-10')
  assert.equal(data.request.endDate, '2026-11-12')
  assert.equal(data.request.message, 'Please include the carry case.')
  assert.equal(data.request.borrower.id, String(borrower._id))
  assert.equal(data.request.borrower.name, borrower.name)
  assert.equal(data.request.owner.id, String(owner._id))
  assert.equal(data.request.owner.name, owner.name)
  assert.equal(data.request.product.id, String(product._id))
  assert.equal(data.request.borrower.email, undefined)
  assert.equal(data.request.owner.email, undefined)
  assert.equal(data.request.decidedBy, undefined)
  assert.equal(data.request.cancelledBy, undefined)
  assert.equal(JSON.stringify(data).includes('passwordHash'), false)

  const stored = await BorrowRequest.findById(data.request.id).lean()
  assert.equal(String(stored.borrower), String(borrower._id))
  assert.equal(String(stored.owner), String(owner._id))
  assert.equal(stored.status, 'Pending')
})

it('rejects a user requesting their own product', async () => {
  const owner = await createUser()
  const product = await createProduct({ owner })

  const { response, data } = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests',
    {
      method: 'POST',
      cookie: authCookie(owner),
      payload: createPayload(product._id),
    }
  )

  assert.equal(response.status, 400)
  assert.match(data.message, /cannot borrow your own product/)
})

it('rejects an unavailable product with 409', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const product = await createProduct({ owner, availability: 'unavailable' })

  const { response, data } = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests',
    {
      method: 'POST',
      cookie: authCookie(borrower),
      payload: createPayload(product._id),
    }
  )

  assert.equal(response.status, 409)
  assert.match(data.message, /currently unavailable/)
  assert.equal(await BorrowRequest.countDocuments({}), 0)
})

it('rejects unpublished, hidden, and removed products with 404', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const variants = [
    { isPublished: false },
    { moderationStatus: 'hidden' },
    { moderationStatus: 'removed' },
  ]

  for (const overrides of variants) {
    const product = await createProduct({ owner, ...overrides })
    const { response } = await apiRequest(
      serverContext.baseUrl,
      '/api/borrow-requests',
      {
        method: 'POST',
        cookie: authCookie(borrower),
        payload: createPayload(product._id),
      }
    )

    assert.equal(response.status, 404)
  }

  assert.equal(await BorrowRequest.countDocuments({}), 0)
})

it('rejects blocked users through the auth middleware', async () => {
  const owner = await createUser()
  const blocked = await createUser({ status: 'blocked' })
  const product = await createProduct({ owner })

  const { response, data } = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests',
    {
      method: 'POST',
      cookie: authCookie(blocked),
      payload: createPayload(product._id),
    }
  )

  assert.equal(response.status, 403)
  assert.match(data.message, /blocked/)
})

it('validates dates and message length at the API boundary', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const product = await createProduct({ owner })
  const cookie = authCookie(borrower)

  const missingDate = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests',
    {
      method: 'POST',
      cookie,
      payload: createPayload(product._id, { startDate: undefined }),
    }
  )
  assert.equal(missingDate.response.status, 400)
  assert.match(missingDate.data.message, /startDate is required/)

  const invalidDate = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests',
    {
      method: 'POST',
      cookie,
      payload: createPayload(product._id, { endDate: '2026-02-30' }),
    }
  )
  assert.equal(invalidDate.response.status, 400)
  assert.match(invalidDate.data.message, /valid date/)

  const reversedRange = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests',
    {
      method: 'POST',
      cookie,
      payload: createPayload(product._id, { endDate: '2026-11-09' }),
    }
  )
  assert.equal(reversedRange.response.status, 400)
  assert.match(reversedRange.data.message, /cannot be earlier/)

  const longMessage = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests',
    {
      method: 'POST',
      cookie,
      payload: createPayload(product._id, { message: 'a'.repeat(501) }),
    }
  )
  assert.equal(longMessage.response.status, 400)
  assert.match(longMessage.data.message, /cannot exceed 500 characters/)

  assert.equal(await BorrowRequest.countDocuments({}), 0)
})

it('blocks duplicate Pending requests but allows new ones after terminal states', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const product = await createProduct({ owner })
  const cookie = authCookie(borrower)

  const first = await apiRequest(serverContext.baseUrl, '/api/borrow-requests', {
    method: 'POST',
    cookie,
    payload: createPayload(product._id),
  })
  assert.equal(first.response.status, 201)
  const firstId = first.data.request.id

  const duplicate = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests',
    {
      method: 'POST',
      cookie,
      payload: createPayload(product._id),
    }
  )
  assert.equal(duplicate.response.status, 409)
  assert.match(duplicate.data.message, /already have a pending request/)

  await BorrowRequest.updateOne(
    { _id: firstId },
    { $set: { status: 'Rejected' } }
  )

  const afterRejected = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests',
    {
      method: 'POST',
      cookie,
      payload: createPayload(product._id),
    }
  )
  assert.equal(afterRejected.response.status, 201)

  const secondDuplicate = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests',
    {
      method: 'POST',
      cookie,
      payload: createPayload(product._id),
    }
  )
  assert.equal(secondDuplicate.response.status, 409)

  await BorrowRequest.updateOne(
    { _id: afterRejected.data.request.id },
    { $set: { status: 'Cancelled' } }
  )

  const afterCancelled = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests',
    {
      method: 'POST',
      cookie,
      payload: createPayload(product._id),
    }
  )
  assert.equal(afterCancelled.response.status, 201)
  assert.equal(await BorrowRequest.countDocuments({ status: 'Pending' }), 1)
})

it('lists only the current borrower requests with public serialization', async () => {
  const ownerOne = await createUser({ name: 'Owner One' })
  const ownerTwo = await createUser({ name: 'Owner Two' })
  const borrowerOne = await createUser({ name: 'Borrower One' })
  const borrowerTwo = await createUser({ name: 'Borrower Two' })

  const productOne = await createProduct({ owner: ownerOne })
  const productTwo = await createProduct({ owner: ownerTwo })
  const productThree = await createProduct({ owner: ownerOne })

  await apiRequest(serverContext.baseUrl, '/api/borrow-requests', {
    method: 'POST',
    cookie: authCookie(borrowerOne),
    payload: createPayload(productOne._id),
  })
  await apiRequest(serverContext.baseUrl, '/api/borrow-requests', {
    method: 'POST',
    cookie: authCookie(borrowerTwo),
    payload: createPayload(productTwo._id),
  })
  await apiRequest(serverContext.baseUrl, '/api/borrow-requests', {
    method: 'POST',
    cookie: authCookie(borrowerOne),
    payload: createPayload(productThree._id),
  })

  const myRequests = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests/my',
    { cookie: authCookie(borrowerOne) }
  )
  assert.equal(myRequests.response.status, 200)
  assert.equal(myRequests.data.requests.length, 2)
  assert.equal(myRequests.data.pagination.total, 2)
  assert.ok(
    myRequests.data.requests.every(
      (request) => request.borrower.id === String(borrowerOne._id)
    )
  )
  assert.equal(myRequests.data.requests[0].borrower.email, undefined)
  assert.equal(myRequests.data.requests[0].owner.email, undefined)
  assert.equal(JSON.stringify(myRequests.data).includes('passwordHash'), false)

  const incomingOne = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests/incoming',
    { cookie: authCookie(ownerOne) }
  )
  assert.equal(incomingOne.response.status, 200)
  assert.equal(incomingOne.data.requests.length, 2)
  assert.ok(
    incomingOne.data.requests.every(
      (request) => request.owner.id === String(ownerOne._id)
    )
  )

  const incomingTwo = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests/incoming',
    { cookie: authCookie(ownerTwo) }
  )
  assert.equal(incomingTwo.response.status, 200)
  assert.equal(incomingTwo.data.requests.length, 1)
})

it('filters lists by status case-insensitively', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const productOne = await createProduct({ owner })
  const productTwo = await createProduct({ owner })
  const cookie = authCookie(borrower)

  await apiRequest(serverContext.baseUrl, '/api/borrow-requests', {
    method: 'POST',
    cookie,
    payload: createPayload(productOne._id),
  })
  const pending = await BorrowRequest.findOne({
    product: productOne._id,
    borrower: borrower._id,
  })
  pending.status = 'Rejected'
  await pending.save()

  await apiRequest(serverContext.baseUrl, '/api/borrow-requests', {
    method: 'POST',
    cookie,
    payload: createPayload(productTwo._id),
  })

  const rejected = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests/my?status=rejected',
    { cookie }
  )
  assert.equal(rejected.response.status, 200)
  assert.equal(rejected.data.requests.length, 1)
  assert.equal(rejected.data.requests[0].status, 'Rejected')

  const pendingOnly = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests/my?status=PENDING',
    { cookie }
  )
  assert.equal(pendingOnly.response.status, 200)
  assert.equal(pendingOnly.data.requests.length, 1)
  assert.equal(pendingOnly.data.requests[0].status, 'Pending')
})

it('paginates lists with a default of 20 and a maximum of 50', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const category = await createCategory()
  const products = await Product.insertMany(
    Array.from({ length: 22 }, (_, index) => ({
      owner: owner._id,
      category: category._id,
      title: `Test Borrow Product ${index}`,
      description: 'A product created for borrow request pagination tests.',
      rentPerDay: 100,
      location: 'Test Area',
    }))
  )

  await BorrowRequest.insertMany(
    products.map((product, index) => ({
      product: product._id,
      owner: owner._id,
      borrower: borrower._id,
      startDate: '2026-11-10',
      endDate: '2026-11-12',
      message: `Request ${index}`,
      status: 'Pending',
    }))
  )

  const cookie = authCookie(borrower)

  const firstPage = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests/my',
    { cookie }
  )
  assert.equal(firstPage.response.status, 200)
  assert.equal(firstPage.data.requests.length, 20)
  assert.deepEqual(firstPage.data.pagination, {
    page: 1,
    limit: 20,
    total: 22,
    totalPages: 2,
    hasNextPage: true,
    hasPreviousPage: false,
  })

  const secondPage = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests/my?page=2',
    { cookie }
  )
  assert.equal(secondPage.response.status, 200)
  assert.equal(secondPage.data.requests.length, 2)
  assert.deepEqual(secondPage.data.pagination, {
    page: 2,
    limit: 20,
    total: 22,
    totalPages: 2,
    hasNextPage: false,
    hasPreviousPage: true,
  })

  const maximumLimit = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests/my?limit=50',
    { cookie }
  )
  assert.equal(maximumLimit.response.status, 200)
  assert.equal(maximumLimit.data.requests.length, 22)
  assert.equal(maximumLimit.data.pagination.limit, 50)

  for (const query of ['limit=51', 'page=0', 'page=abc', 'limit=0', 'status=Active']) {
    const response = await apiRequest(
      serverContext.baseUrl,
      `/api/borrow-requests/my?${query}`,
      { cookie }
    )
    assert.equal(response.response.status, 400, `Expected 400 for ${query}`)
  }
})

it('rate limits creation attempts per authenticated user', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  await createProduct({ owner })
  const cookie = authCookie(borrower)
  const missingProduct = String(new mongoose.Types.ObjectId())

  await borrowRequestCreateLimiter.resetKey(String(borrower._id))

  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const { response } = await apiRequest(
      serverContext.baseUrl,
      '/api/borrow-requests',
      {
        method: 'POST',
        cookie,
        payload: createPayload(missingProduct),
      }
    )
    assert.equal(response.status, 404, `Attempt ${attempt} should be counted`)
  }

  const blocked = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests',
    {
      method: 'POST',
      cookie,
      payload: createPayload(missingProduct),
    }
  )
  assert.equal(blocked.response.status, 429)
  assert.equal(blocked.data.error, 'Too Many Requests')
  assert.match(blocked.data.message, /Too many borrow request attempts/)

  await borrowRequestCreateLimiter.resetKey(String(borrower._id))
})

it('does not count unrelated API requests against the creation limit', async () => {
  const borrower = await createUser()
  const cookie = authCookie(borrower)

  await borrowRequestCreateLimiter.resetKey(String(borrower._id))

  for (let attempt = 1; attempt <= 25; attempt += 1) {
    const { response } = await apiRequest(
      serverContext.baseUrl,
      '/api/borrow-requests/my',
      { cookie }
    )
    assert.equal(response.status, 200)
  }

  const createAttempt = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests',
    {
      method: 'POST',
      cookie,
      payload: createPayload(new mongoose.Types.ObjectId()),
    }
  )
  assert.equal(createAttempt.response.status, 404)

  await borrowRequestCreateLimiter.resetKey(String(borrower._id))
})

it('rejects invalid product ids and unknown products', async () => {
  const borrower = await createUser()
  const cookie = authCookie(borrower)

  const invalid = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests',
    {
      method: 'POST',
      cookie,
      payload: createPayload('not-an-object-id'),
    }
  )
  assert.equal(invalid.response.status, 400)

  const missing = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests',
    {
      method: 'POST',
      cookie,
      payload: createPayload(new mongoose.Types.ObjectId()),
    }
  )
  assert.equal(missing.response.status, 404)
})

it('requires authentication for every borrow request endpoint', async () => {
  const createResponse = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests',
    { method: 'POST', payload: createPayload(new mongoose.Types.ObjectId()) }
  )
  assert.equal(createResponse.response.status, 401)

  const myResponse = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests/my'
  )
  assert.equal(myResponse.response.status, 401)

  const incomingResponse = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests/incoming'
  )
  assert.equal(incomingResponse.response.status, 401)
})
