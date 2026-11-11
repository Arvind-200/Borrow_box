import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { Review } from '../../src/models/Review.js'
import { Product } from '../../src/models/Product.js'
import { User } from '../../src/models/User.js'
import { BorrowRequest } from '../../src/models/BorrowRequest.js'
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

async function createVisibleReview({ rating = 5, comment = 'Great item.' } = {}) {
  const owner = await createUser({ name: 'Owner One' })
  const borrower = await createUser({ name: 'Borrower One' })
  const product = await createProduct({ owner })
  const request = await createCompletedBorrow(owner, borrower, product)

  const { response, data } = await apiRequest(
    serverContext.baseUrl,
    '/api/reviews',
    {
      method: 'POST',
      cookie: authCookie(borrower),
      payload: {
        borrowRequest: String(request._id),
        rating,
        comment,
      },
    }
  )
  assert.equal(response.status, 201)

  return { owner, borrower, product, request, review: data.review }
}

function adminList(cookie, query = '') {
  return apiRequest(serverContext.baseUrl, `/api/admin/reviews${query}`, {
    cookie,
  })
}

function moderate(cookie, reviewId, action, payload) {
  return apiRequest(
    serverContext.baseUrl,
    `/api/admin/reviews/${reviewId}/${action}`,
    { method: 'PATCH', cookie, payload }
  )
}

it('requires authentication and the admin role', async () => {
  const normalUser = await createUser()
  const admin = await createUser({ role: 'admin' })

  const anonymous = await adminList(undefined)
  assert.equal(anonymous.response.status, 401)

  const nonAdmin = await adminList(authCookie(normalUser))
  assert.equal(nonAdmin.response.status, 403)
  assert.match(nonAdmin.data.message, /admin access required/i)

  const allowed = await adminList(authCookie(admin))
  assert.equal(allowed.response.status, 200)
})

it('lists reviews with pagination, filters, and moderation fields', async () => {
  const admin = await createUser({ role: 'admin' })
  const { review } = await createVisibleReview({ rating: 4 })

  await moderate(authCookie(admin), review.id, 'hide', {
    reason: 'Fake review',
  })

  const all = await adminList(authCookie(admin), '?limit=5')
  assert.equal(all.response.status, 200)
  assert.equal(all.data.reviews.length, 1)
  assert.equal(all.data.pagination.page, 1)
  assert.equal(all.data.pagination.limit, 5)
  assert.equal(all.data.pagination.total, 1)

  const listed = all.data.reviews[0]
  assert.equal(listed.id, review.id)
  assert.equal(listed.status, 'hidden')
  assert.deepEqual(listed.moderatedBy.name, admin.name)
  assert.equal(listed.moderationReason, 'Fake review')
  assert.ok(listed.moderatedAt)
  assert.equal(typeof listed.product.title, 'string')
  assert.equal(listed.reviewer.email, undefined)
  assert.equal(JSON.stringify(all.data).includes('passwordHash'), false)

  const hidden = await adminList(authCookie(admin), '?status=hidden')
  assert.equal(hidden.data.reviews.length, 1)

  const visible = await adminList(authCookie(admin), '?status=visible')
  assert.equal(visible.data.reviews.length, 0)
})

it('hides a review, removing it from public listings and ratings', async () => {
  const admin = await createUser({ role: 'admin' })
  const { owner, product, review } = await createVisibleReview({ rating: 5 })

  const before = await apiRequest(
    serverContext.baseUrl,
    `/api/products/${product._id}`
  )
  assert.equal(before.data.product.rating.average, 5)
  assert.equal(before.data.product.rating.count, 1)

  const { response, data } = await moderate(
    authCookie(admin),
    review.id,
    'hide',
    { reason: '  Offensive content  ' }
  )

  assert.equal(response.status, 200)
  assert.equal(data.review.status, 'hidden')
  assert.equal(data.review.moderationReason, 'Offensive content')
  assert.equal(data.review.moderatedBy.id, String(admin._id))
  assert.equal(data.ratings.product.ratingAverage, 0)
  assert.equal(data.ratings.product.reviewCount, 0)

  const stored = await Review.findById(review.id).lean()
  assert.equal(stored.status, 'hidden')

  const publicReviews = await apiRequest(
    serverContext.baseUrl,
    `/api/products/${product._id}/reviews`
  )
  assert.equal(publicReviews.data.reviews.length, 0)

  const storedProduct = await Product.findById(product._id).lean()
  assert.equal(storedProduct.ratingAverage, 0)
  assert.equal(storedProduct.reviewCount, 0)

  const storedOwner = await User.findById(owner._id).lean()
  assert.equal(storedOwner.ratingAverage, 0)
  assert.equal(storedOwner.reviewCount, 0)
})

it('requires a reason and enforces valid status transitions', async () => {
  const admin = await createUser({ role: 'admin' })
  const { product, review } = await createVisibleReview({ rating: 3 })

  const withoutReason = await moderate(
    authCookie(admin),
    review.id,
    'hide',
    {}
  )
  assert.equal(withoutReason.response.status, 400)
  assert.match(withoutReason.data.message, /reason is required/i)

  const hide = await moderate(authCookie(admin), review.id, 'hide', {
    reason: 'Wrong information',
  })
  assert.equal(hide.response.status, 200)
  assert.equal(hide.data.review.status, 'hidden')

  const hideAgain = await moderate(authCookie(admin), review.id, 'hide', {
    reason: 'Wrong information',
  })
  assert.equal(hideAgain.response.status, 409)

  const remove = await moderate(authCookie(admin), review.id, 'remove', {
    reason: 'Confirmed fake',
  })
  assert.equal(remove.response.status, 200)
  assert.equal(remove.data.review.status, 'removed')

  const removeAgain = await moderate(authCookie(admin), review.id, 'remove', {
    reason: 'Confirmed fake',
  })
  assert.equal(removeAgain.response.status, 409)

  const restore = await moderate(
    authCookie(admin),
    review.id,
    'restore',
    {}
  )
  assert.equal(restore.response.status, 200)
  assert.equal(restore.data.review.status, 'visible')
  assert.equal(restore.data.ratings.product.reviewCount, 1)

  const restoreAgain = await moderate(
    authCookie(admin),
    review.id,
    'restore',
    {}
  )
  assert.equal(restoreAgain.response.status, 409)

  const storedProduct = await Product.findById(product._id).lean()
  assert.equal(storedProduct.reviewCount, 1)
  assert.equal(storedProduct.ratingAverage, 3)
})

it('removes a visible review directly', async () => {
  const admin = await createUser({ role: 'admin' })
  const { review } = await createVisibleReview({ rating: 2 })

  const { response, data } = await moderate(
    authCookie(admin),
    review.id,
    'remove',
    { reason: 'Scam review' }
  )

  assert.equal(response.status, 200)
  assert.equal(data.review.status, 'removed')
  assert.equal(data.ratings.product.reviewCount, 0)
})

it('rejects invalid or missing review ids', async () => {
  const admin = await createUser({ role: 'admin' })

  const invalid = await moderate(authCookie(admin), 'not-an-id', 'hide', {
    reason: 'Spam',
  })
  assert.equal(invalid.response.status, 400)

  const missing = await moderate(
    authCookie(admin),
    '64b7f6b1c2a4e8a1b2c3d4e5',
    'hide',
    { reason: 'Spam' }
  )
  assert.equal(missing.response.status, 404)
})

it('blocks non-admin moderation attempts', async () => {
  const normalUser = await createUser()
  const { review } = await createVisibleReview({ rating: 4 })

  const { response } = await moderate(
    authCookie(normalUser),
    review.id,
    'hide',
    { reason: 'Spam' }
  )
  assert.equal(response.status, 403)

  const stored = await Review.findById(review.id).lean()
  assert.equal(stored.status, 'visible')
})
