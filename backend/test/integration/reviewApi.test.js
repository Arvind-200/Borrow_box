import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { Review } from '../../src/models/Review.js'
import { Product } from '../../src/models/Product.js'
import { User } from '../../src/models/User.js'
import { BorrowRequest } from '../../src/models/BorrowRequest.js'
import {
  recomputeProductRating,
  recomputeUserRating,
} from '../../src/services/reviewService.js'
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

async function createCompletedBorrow(owner, borrower, product) {
  return BorrowRequest.create({
    product: product._id,
    owner: owner._id,
    borrower: borrower._id,
    startDate: '2026-11-10',
    endDate: '2026-11-12',
    status: 'Completed',
    completedAt: new Date(),
    completedBy: owner._id,
  })
}

function reviewPayload(borrowRequestId, overrides = {}) {
  return {
    borrowRequest: String(borrowRequestId),
    rating: 5,
    comment: 'Great condition and an easy handover.',
    ...overrides,
  }
}

function createReview(cookie, payload) {
  return apiRequest(serverContext.baseUrl, '/api/reviews', {
    method: 'POST',
    cookie,
    payload,
  })
}

it('creates a review for a completed borrow and updates ratings', async () => {
  const owner = await createUser({ name: 'Owner One' })
  const borrower = await createUser({ name: 'Borrower One' })
  const product = await createProduct({ owner })
  const request = await createCompletedBorrow(owner, borrower, product)

  const { response, data } = await createReview(
    authCookie(borrower),
    reviewPayload(request._id, {
      rating: 4,
      comment: '  Solid drill, minor scratches.  ',
    })
  )

  assert.equal(response.status, 201)
  assert.equal(data.review.borrowRequest, String(request._id))
  assert.equal(data.review.product, String(product._id))
  assert.equal(data.review.reviewer.id, String(borrower._id))
  assert.equal(data.review.reviewer.name, borrower.name)
  assert.equal(data.review.reviewee.id, String(owner._id))
  assert.equal(data.review.reviewee.name, owner.name)
  assert.equal(data.review.reviewerRole, 'borrower')
  assert.equal(data.review.rating, 4)
  assert.equal(data.review.comment, 'Solid drill, minor scratches.')
  assert.equal(data.review.status, 'visible')
  assert.equal(JSON.stringify(data).includes('passwordHash'), false)
  assert.equal(data.review.reviewer.email, undefined)

  const stored = await Review.findOne({ borrowRequest: request._id }).lean()
  assert.ok(stored)

  const storedProduct = await Product.findById(product._id).lean()
  assert.equal(storedProduct.ratingAverage, 4)
  assert.equal(storedProduct.reviewCount, 1)

  const storedOwner = await User.findById(owner._id).lean()
  assert.equal(storedOwner.ratingAverage, 4)
  assert.equal(storedOwner.reviewCount, 1)

  const detail = await apiRequest(
    serverContext.baseUrl,
    `/api/products/${product._id}`
  )
  assert.equal(detail.response.status, 200)
  assert.equal(detail.data.product.rating.average, 4)
  assert.equal(detail.data.product.rating.count, 1)
  assert.equal(detail.data.product.owner.rating.average, 4)
  assert.equal(detail.data.product.owner.rating.count, 1)
})

it('rejects reviews for borrows that are not completed', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const product = await createProduct({ owner })
  const request = await BorrowRequest.create({
    product: product._id,
    owner: owner._id,
    borrower: borrower._id,
    startDate: '2026-11-10',
    endDate: '2026-11-12',
    status: 'Accepted',
  })

  const { response, data } = await createReview(
    authCookie(borrower),
    reviewPayload(request._id)
  )

  assert.equal(response.status, 409)
  assert.match(data.message, /completed borrows/i)
  assert.equal(await Review.countDocuments({}), 0)
})

it('only lets the borrower review the borrow request', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const stranger = await createUser()
  const product = await createProduct({ owner })
  const request = await createCompletedBorrow(owner, borrower, product)

  const ownerAttempt = await createReview(
    authCookie(owner),
    reviewPayload(request._id)
  )
  assert.equal(ownerAttempt.response.status, 403)
  assert.match(ownerAttempt.data.message, /only the borrower/i)

  const strangerAttempt = await createReview(
    authCookie(stranger),
    reviewPayload(request._id)
  )
  assert.equal(strangerAttempt.response.status, 403)
})

it('blocks duplicate reviews for the same borrow', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const product = await createProduct({ owner })
  const request = await createCompletedBorrow(owner, borrower, product)

  const first = await createReview(authCookie(borrower), reviewPayload(request._id))
  assert.equal(first.response.status, 201)

  const second = await createReview(
    authCookie(borrower),
    reviewPayload(request._id, { rating: 3 })
  )
  assert.equal(second.response.status, 409)
  assert.match(second.data.message, /already reviewed/i)
  assert.equal(await Review.countDocuments({}), 1)
})

it('rejects invalid review payloads and ids', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const product = await createProduct({ owner })
  const request = await createCompletedBorrow(owner, borrower, product)

  const badRating = await createReview(
    authCookie(borrower),
    reviewPayload(request._id, { rating: 6 })
  )
  assert.equal(badRating.response.status, 400)

  const badId = await createReview(
    authCookie(borrower),
    reviewPayload('not-an-id')
  )
  assert.equal(badId.response.status, 400)

  const missing = await createReview(
    authCookie(borrower),
    reviewPayload('64b7f6b1c2a4e8a1b2c3d4e5')
  )
  assert.equal(missing.response.status, 404)
})

it('requires authentication for review creation and my reviews', async () => {
  const created = await createReview(undefined, {
    borrowRequest: '64b7f6b1c2a4e8a1b2c3d4e5',
    rating: 5,
  })
  assert.equal(created.response.status, 401)

  const mine = await apiRequest(serverContext.baseUrl, '/api/reviews/mine')
  assert.equal(mine.response.status, 401)
})

it('lists only visible reviews for a product with pagination', async () => {
  const owner = await createUser()
  const borrowerOne = await createUser()
  const borrowerTwo = await createUser()
  const product = await createProduct({ owner })

  const requestOne = await createCompletedBorrow(owner, borrowerOne, product)
  const requestTwo = await createCompletedBorrow(owner, borrowerTwo, product)

  await createReview(
    authCookie(borrowerOne),
    reviewPayload(requestOne._id, { rating: 5 })
  )
  await createReview(
    authCookie(borrowerTwo),
    reviewPayload(requestTwo._id, { rating: 3 })
  )

  await Review.updateOne(
    { borrowRequest: requestTwo._id },
    { $set: { status: 'hidden' } }
  )
  await Promise.all([
    recomputeProductRating(product._id),
    recomputeUserRating(owner._id),
  ])

  const { response, data } = await apiRequest(
    serverContext.baseUrl,
    `/api/products/${product._id}/reviews`
  )

  assert.equal(response.status, 200)
  assert.equal(data.reviews.length, 1)
  assert.equal(data.reviews[0].rating, 5)
  assert.equal(data.pagination.total, 1)
  assert.equal(data.pagination.page, 1)

  const storedProduct = await Product.findById(product._id).lean()
  assert.equal(storedProduct.ratingAverage, 5)
  assert.equal(storedProduct.reviewCount, 1)

  const storedOwner = await User.findById(owner._id).lean()
  assert.equal(storedOwner.ratingAverage, 5)
  assert.equal(storedOwner.reviewCount, 1)
})

it('returns 400 or 404 for invalid or missing review products', async () => {
  const invalid = await apiRequest(
    serverContext.baseUrl,
    '/api/products/not-an-id/reviews'
  )
  assert.equal(invalid.response.status, 400)

  const missing = await apiRequest(
    serverContext.baseUrl,
    '/api/products/64b7f6b1c2a4e8a1b2c3d4e5/reviews'
  )
  assert.equal(missing.response.status, 404)
})

it('lists only the reviews written by the current user', async () => {
  const owner = await createUser()
  const borrowerOne = await createUser()
  const borrowerTwo = await createUser()
  const product = await createProduct({ owner })

  const requestOne = await createCompletedBorrow(owner, borrowerOne, product)
  const requestTwo = await createCompletedBorrow(owner, borrowerTwo, product)

  await createReview(authCookie(borrowerOne), reviewPayload(requestOne._id))
  await createReview(authCookie(borrowerTwo), reviewPayload(requestTwo._id))

  const { response, data } = await apiRequest(
    serverContext.baseUrl,
    '/api/reviews/mine',
    { cookie: authCookie(borrowerOne) }
  )

  assert.equal(response.status, 200)
  assert.equal(data.reviews.length, 1)
  assert.equal(data.reviews[0].borrowRequest, String(requestOne._id))
  assert.equal(data.reviews[0].reviewer.id, String(borrowerOne._id))
})

it('keeps the owner rating when the reviewed product was deleted', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const product = await createProduct({ owner })
  const request = await createCompletedBorrow(owner, borrower, product)

  await Product.deleteOne({ _id: product._id })

  const { response } = await createReview(
    authCookie(borrower),
    reviewPayload(request._id)
  )

  assert.equal(response.status, 201)

  const storedOwner = await User.findById(owner._id).lean()
  assert.equal(storedOwner.ratingAverage, 5)
  assert.equal(storedOwner.reviewCount, 1)
})

it('rate limits review attempts per user', async () => {
  const user = await createUser()

  let lastStatus = null
  for (let attempt = 0; attempt < 21; attempt += 1) {
    const { response } = await createReview(authCookie(user), {
      borrowRequest: 'not-an-id',
      rating: 5,
    })
    lastStatus = response.status
  }

  assert.equal(lastStatus, 429)
})
