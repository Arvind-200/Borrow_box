import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { BorrowRequest } from '../../src/models/BorrowRequest.js'
import { Product } from '../../src/models/Product.js'
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

async function createPendingRequest(borrower, product) {
  const { response, data } = await apiRequest(
    serverContext.baseUrl,
    '/api/borrow-requests',
    {
      method: 'POST',
      cookie: authCookie(borrower),
      payload: {
        product: String(product._id),
        startDate: '2026-11-10',
        endDate: '2026-11-12',
        message: 'Concurrency test request.',
      },
    }
  )

  assert.equal(response.status, 201)
  return data.request
}

function acceptRequest(owner, requestId) {
  return apiRequest(
    serverContext.baseUrl,
    `/api/borrow-requests/${requestId}/accept`,
    {
      method: 'PATCH',
      cookie: authCookie(owner),
    }
  )
}

function rejectRequest(owner, requestId) {
  return apiRequest(
    serverContext.baseUrl,
    `/api/borrow-requests/${requestId}/reject`,
    {
      method: 'PATCH',
      cookie: authCookie(owner),
    }
  )
}

it('allows exactly one of two concurrent accepts for the same product', async () => {
  const owner = await createUser()
  const borrowerOne = await createUser()
  const borrowerTwo = await createUser()
  const product = await createProduct({ owner })
  const requestOne = await createPendingRequest(borrowerOne, product)
  const requestTwo = await createPendingRequest(borrowerTwo, product)

  const results = await Promise.all([
    acceptRequest(owner, requestOne.id),
    acceptRequest(owner, requestTwo.id),
  ])

  const statuses = results.map((result) => result.response.status).sort()
  assert.deepEqual(statuses, [200, 409])

  assert.equal(
    await BorrowRequest.countDocuments({ status: 'Accepted' }),
    1
  )
  assert.equal(await BorrowRequest.countDocuments({ status: 'Pending' }), 1)

  const storedProduct = await Product.findById(product._id).lean()
  assert.equal(storedProduct.availability, 'unavailable')
})

it('allows exactly one of two concurrent accepts for the same request', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const product = await createProduct({ owner })
  const request = await createPendingRequest(borrower, product)

  const results = await Promise.all([
    acceptRequest(owner, request.id),
    acceptRequest(owner, request.id),
  ])

  const statuses = results.map((result) => result.response.status).sort()
  assert.deepEqual(statuses, [200, 409])

  assert.equal(
    await BorrowRequest.countDocuments({ status: 'Accepted' }),
    1
  )
  const storedProduct = await Product.findById(product._id).lean()
  assert.equal(storedProduct.availability, 'unavailable')
})

it('resolves a concurrent accept and reject with one winner', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const product = await createProduct({ owner })
  const request = await createPendingRequest(borrower, product)

  const [acceptResult, rejectResult] = await Promise.all([
    acceptRequest(owner, request.id),
    rejectRequest(owner, request.id),
  ])

  const statuses = [
    acceptResult.response.status,
    rejectResult.response.status,
  ].sort()
  assert.deepEqual(statuses, [200, 409])

  const storedRequest = await BorrowRequest.findById(request.id).lean()
  const storedProduct = await Product.findById(product._id).lean()

  if (storedRequest.status === 'Accepted') {
    assert.equal(storedProduct.availability, 'unavailable')
  } else {
    assert.equal(storedRequest.status, 'Rejected')
    assert.equal(storedProduct.availability, 'available')
  }
})
