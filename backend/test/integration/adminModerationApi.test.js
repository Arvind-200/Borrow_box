import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { Product } from '../../src/models/Product.js'
import { User } from '../../src/models/User.js'
import { Review } from '../../src/models/Review.js'
import { AdminActivityLog } from '../../src/models/AdminActivityLog.js'
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

function request(path, options = {}) {
  return apiRequest(serverContext.baseUrl, path, options)
}

function submitReport(cookie, payload) {
  return request('/api/reports', { method: 'POST', cookie, payload })
}

function resolveReport(cookie, id, payload) {
  return request(`/api/admin/reports/${id}/resolve`, {
    method: 'PATCH',
    cookie,
    payload,
  })
}

function dismissReport(cookie, id, payload) {
  return request(`/api/admin/reports/${id}/dismiss`, {
    method: 'PATCH',
    cookie,
    payload,
  })
}

function moderateProduct(cookie, id, action, payload) {
  return request(`/api/admin/products/${id}/${action}`, {
    method: 'PATCH',
    cookie,
    payload,
  })
}

function moderateUser(cookie, id, action, payload) {
  return request(`/api/admin/users/${id}/${action}`, {
    method: 'PATCH',
    cookie,
    payload,
  })
}

it('restricts the admin report queue to admins', async () => {
  const normalUser = await createUser()
  const admin = await createUser({ role: 'admin' })

  const anonymous = await request('/api/admin/reports')
  assert.equal(anonymous.response.status, 401)

  const forbidden = await request('/api/admin/reports', {
    cookie: authCookie(normalUser),
  })
  assert.equal(forbidden.response.status, 403)

  const allowed = await request('/api/admin/reports', {
    cookie: authCookie(admin),
  })
  assert.equal(allowed.response.status, 200)
  assert.deepEqual(allowed.data.reports, [])
})

it('lists reports with filters, snapshots, and detail lookup', async () => {
  const admin = await createUser({ role: 'admin' })
  const reporter = await createUser({ name: 'Reporter One' })
  const owner = await createUser({ name: 'Owner One' })
  const product = await createProduct({ owner, title: 'Suspicious Drill' })

  const created = await submitReport(authCookie(reporter), {
    targetType: 'product',
    targetId: String(product._id),
    reason: 'fake_listing',
    description: 'Looks like a scam.',
  })
  assert.equal(created.response.status, 201)
  const reportId = created.data.report.id

  const list = await request('/api/admin/reports?status=open&targetType=product', {
    cookie: authCookie(admin),
  })
  assert.equal(list.response.status, 200)
  assert.equal(list.data.reports.length, 1)
  assert.equal(list.data.pagination.total, 1)

  const listed = list.data.reports[0]
  assert.equal(listed.id, reportId)
  assert.equal(listed.reporter.name, 'Reporter One')
  assert.equal(listed.target.title, 'Suspicious Drill')
  assert.equal(listed.target.ownerId, String(owner._id))
  assert.equal(listed.status, 'Open')
  assert.equal(JSON.stringify(list.data).includes('passwordHash'), false)

  const noMatch = await request('/api/admin/reports?status=Resolved', {
    cookie: authCookie(admin),
  })
  assert.equal(noMatch.data.reports.length, 0)

  const detail = await request(`/api/admin/reports/${reportId}`, {
    cookie: authCookie(admin),
  })
  assert.equal(detail.response.status, 200)
  assert.equal(detail.data.report.id, reportId)
  assert.equal(detail.data.report.description, 'Looks like a scam.')

  const invalid = await request('/api/admin/reports/not-an-id', {
    cookie: authCookie(admin),
  })
  assert.equal(invalid.response.status, 400)

  const missing = await request('/api/admin/reports/64b7f6b1c2a4e8a1b2c3d4e5', {
    cookie: authCookie(admin),
  })
  assert.equal(missing.response.status, 404)
})

it('resolves a report by hiding the product and records audit logs', async () => {
  const admin = await createUser({ role: 'admin' })
  const reporter = await createUser()
  const owner = await createUser()
  const product = await createProduct({ owner })

  const created = await submitReport(authCookie(reporter), {
    targetType: 'product',
    targetId: String(product._id),
    reason: 'fake_listing',
  })

  const resolved = await resolveReport(authCookie(admin), created.data.report.id, {
    action: 'hide_product',
    note: 'Confirmed fake listing',
  })

  assert.equal(resolved.response.status, 200)
  assert.equal(resolved.data.report.status, 'Resolved')
  assert.equal(resolved.data.report.resolutionAction, 'hide_product')
  assert.equal(resolved.data.report.resolutionNote, 'Confirmed fake listing')
  assert.equal(resolved.data.report.reviewedBy.id, String(admin._id))

  const storedProduct = await Product.findById(product._id).lean()
  assert.equal(storedProduct.moderationStatus, 'hidden')

  const publicDetail = await request(`/api/products/${product._id}`)
  assert.equal(publicDetail.response.status, 404)

  const publicList = await request('/api/products?limit=50')
  assert.equal(
    publicList.data.products.some((item) => item.id === String(product._id)),
    false
  )

  const productLog = await AdminActivityLog.findOne({
    action: 'hide_product',
    targetId: product._id,
  }).lean()
  assert.ok(productLog)
  assert.equal(String(productLog.admin), String(admin._id))

  const reportLog = await AdminActivityLog.findOne({
    action: 'resolve_report',
    targetId: created.data.report.id,
  }).lean()
  assert.ok(reportLog)
  assert.equal(reportLog.metadata.action, 'hide_product')

  const resolveAgain = await resolveReport(
    authCookie(admin),
    created.data.report.id,
    { action: 'none' }
  )
  assert.equal(resolveAgain.response.status, 409)
})

it('dismisses a report without moderating the target', async () => {
  const admin = await createUser({ role: 'admin' })
  const reporter = await createUser()
  const owner = await createUser()
  const product = await createProduct({ owner })

  const created = await submitReport(authCookie(reporter), {
    targetType: 'product',
    targetId: String(product._id),
    reason: 'wrong_information',
  })

  const dismissed = await dismissReport(
    authCookie(admin),
    created.data.report.id,
    { note: 'Listing is accurate' }
  )

  assert.equal(dismissed.response.status, 200)
  assert.equal(dismissed.data.report.status, 'Dismissed')
  assert.equal(dismissed.data.report.resolutionAction, 'none')

  const storedProduct = await Product.findById(product._id).lean()
  assert.equal(storedProduct.moderationStatus, 'active')

  const log = await AdminActivityLog.findOne({
    action: 'dismiss_report',
    targetId: created.data.report.id,
  }).lean()
  assert.ok(log)
})

it('warns the offender when resolving a report', async () => {
  const admin = await createUser({ role: 'admin' })
  const reporter = await createUser()
  const owner = await createUser()
  const product = await createProduct({ owner })

  const created = await submitReport(authCookie(reporter), {
    targetType: 'product',
    targetId: String(product._id),
    reason: 'scam_fraud',
  })

  const resolved = await resolveReport(authCookie(admin), created.data.report.id, {
    action: 'warn_user',
    note: 'First warning',
  })

  assert.equal(resolved.response.status, 200)

  const storedOwner = await User.findById(owner._id).lean()
  assert.equal(storedOwner.warningCount, 1)
  assert.ok(storedOwner.lastWarnedAt)

  const log = await AdminActivityLog.findOne({
    action: 'warn_user',
    targetId: owner._id,
  }).lean()
  assert.ok(log)
  assert.equal(log.reason, 'First warning')
})

it('blocks the offender when resolving a report, then unblocks them', async () => {
  const admin = await createUser({ role: 'admin' })
  const reporter = await createUser()
  const owner = await createUser()
  const product = await createProduct({ owner })

  const created = await submitReport(authCookie(reporter), {
    targetType: 'product',
    targetId: String(product._id),
    reason: 'scam_fraud',
  })

  const resolved = await resolveReport(authCookie(admin), created.data.report.id, {
    action: 'block_user',
    note: 'Fraud confirmed',
  })
  assert.equal(resolved.response.status, 200)

  const blockedOwner = await User.findById(owner._id).lean()
  assert.equal(blockedOwner.status, 'blocked')

  const blockedAccess = await request('/api/products/mine', {
    cookie: authCookie(owner),
  })
  assert.equal(blockedAccess.response.status, 403)

  const unblocked = await moderateUser(
    authCookie(admin),
    String(owner._id),
    'unblock',
    { reason: 'Appeal accepted' }
  )
  assert.equal(unblocked.response.status, 200)
  assert.equal(unblocked.data.user.status, 'active')

  const restoredAccess = await request('/api/products/mine', {
    cookie: authCookie(owner),
  })
  assert.equal(restoredAccess.response.status, 200)
})

it('enforces product moderation transitions and public visibility', async () => {
  const admin = await createUser({ role: 'admin' })
  const owner = await createUser()
  const product = await createProduct({ owner })

  const withoutReason = await moderateProduct(
    authCookie(admin),
    String(product._id),
    'hide',
    {}
  )
  assert.equal(withoutReason.response.status, 400)

  const hidden = await moderateProduct(
    authCookie(admin),
    String(product._id),
    'hide',
    { reason: 'Prohibited item' }
  )
  assert.equal(hidden.response.status, 200)
  assert.equal(hidden.data.product.moderationStatus, 'hidden')

  const publicAfterHide = await request(`/api/products/${product._id}`)
  assert.equal(publicAfterHide.response.status, 404)

  const hideAgain = await moderateProduct(
    authCookie(admin),
    String(product._id),
    'hide',
    { reason: 'Prohibited item' }
  )
  assert.equal(hideAgain.response.status, 409)

  const removed = await moderateProduct(
    authCookie(admin),
    String(product._id),
    'remove',
    { reason: 'Confirmed prohibited' }
  )
  assert.equal(removed.response.status, 200)
  assert.equal(removed.data.product.moderationStatus, 'removed')

  const restored = await moderateProduct(
    authCookie(admin),
    String(product._id),
    'restore',
    {}
  )
  assert.equal(restored.response.status, 200)
  assert.equal(restored.data.product.moderationStatus, 'active')

  const publicAfterRestore = await request(`/api/products/${product._id}`)
  assert.equal(publicAfterRestore.response.status, 200)

  const invalid = await moderateProduct(
    authCookie(admin),
    'not-an-id',
    'hide',
    { reason: 'Spam' }
  )
  assert.equal(invalid.response.status, 400)

  const missing = await moderateProduct(
    authCookie(admin),
    '64b7f6b1c2a4e8a1b2c3d4e5',
    'hide',
    { reason: 'Spam' }
  )
  assert.equal(missing.response.status, 404)
})

it('enforces user moderation rules and guards', async () => {
  const admin = await createUser({ role: 'admin' })
  const otherAdmin = await createUser({ role: 'admin' })
  const user = await createUser()

  const warnWithoutReason = await moderateUser(
    authCookie(admin),
    String(user._id),
    'warn',
    {}
  )
  assert.equal(warnWithoutReason.response.status, 400)

  const warned = await moderateUser(authCookie(admin), String(user._id), 'warn', {
    reason: 'Late returns',
  })
  assert.equal(warned.response.status, 200)
  assert.equal(warned.data.user.warningCount, 1)

  const selfBlock = await moderateUser(
    authCookie(admin),
    String(admin._id),
    'block',
    { reason: 'Test' }
  )
  assert.equal(selfBlock.response.status, 400)

  const adminBlock = await moderateUser(
    authCookie(admin),
    String(otherAdmin._id),
    'block',
    { reason: 'Test' }
  )
  assert.equal(adminBlock.response.status, 409)

  const blocked = await moderateUser(authCookie(admin), String(user._id), 'block', {
    reason: 'Fraud',
  })
  assert.equal(blocked.response.status, 200)
  assert.equal(blocked.data.user.status, 'blocked')

  const blockAgain = await moderateUser(
    authCookie(admin),
    String(user._id),
    'block',
    { reason: 'Fraud' }
  )
  assert.equal(blockAgain.response.status, 409)

  const unblocked = await moderateUser(
    authCookie(admin),
    String(user._id),
    'unblock',
    {}
  )
  assert.equal(unblocked.response.status, 200)

  const unblockAgain = await moderateUser(
    authCookie(admin),
    String(user._id),
    'unblock',
    {}
  )
  assert.equal(unblockAgain.response.status, 409)
})

it('blocks non-admin moderation attempts', async () => {
  const normalUser = await createUser()
  const owner = await createUser()
  const product = await createProduct({ owner })

  const reportList = await request('/api/admin/reports', {
    cookie: authCookie(normalUser),
  })
  assert.equal(reportList.response.status, 403)

  const productModeration = await moderateProduct(
    authCookie(normalUser),
    String(product._id),
    'hide',
    { reason: 'Spam' }
  )
  assert.equal(productModeration.response.status, 403)

  const userModeration = await moderateUser(
    authCookie(normalUser),
    String(owner._id),
    'block',
    { reason: 'Spam' }
  )
  assert.equal(userModeration.response.status, 403)

  const storedProduct = await Product.findById(product._id).lean()
  assert.equal(storedProduct.moderationStatus, 'active')
})

it('hides a reported review and recomputes ratings', async () => {
  const admin = await createUser({ role: 'admin' })
  const reporter = await createUser()
  const owner = await createUser()
  const borrower = await createUser()
  const product = await createProduct({ owner })

  const borrowRequest = await request('/api/borrow-requests', {
    method: 'POST',
    cookie: authCookie(borrower),
    payload: {
      product: String(product._id),
      startDate: '2026-11-10',
      endDate: '2026-11-12',
    },
  })
  assert.equal(borrowRequest.response.status, 201)

  await request(`/api/borrow-requests/${borrowRequest.data.request.id}/accept`, {
    method: 'PATCH',
    cookie: authCookie(owner),
  })
  await request(
    `/api/borrow-requests/${borrowRequest.data.request.id}/complete`,
    {
      method: 'PATCH',
      cookie: authCookie(owner),
    }
  )

  const review = await request('/api/reviews', {
    method: 'POST',
    cookie: authCookie(borrower),
    payload: {
      borrowRequest: borrowRequest.data.request.id,
      rating: 5,
      comment: 'Great drill.',
    },
  })
  assert.equal(review.response.status, 201)

  const report = await submitReport(authCookie(reporter), {
    targetType: 'review',
    targetId: review.data.review.id,
    reason: 'offensive_content',
  })
  assert.equal(report.response.status, 201)

  const resolved = await resolveReport(authCookie(admin), report.data.report.id, {
    action: 'hide_review',
    note: 'Offensive content confirmed',
  })
  assert.equal(resolved.response.status, 200)

  const storedReview = await Review.findById(review.data.review.id).lean()
  assert.equal(storedReview.status, 'hidden')

  const publicReviews = await request(`/api/products/${product._id}/reviews`)
  assert.equal(publicReviews.data.reviews.length, 0)

  const storedProduct = await Product.findById(product._id).lean()
  assert.equal(storedProduct.reviewCount, 0)
  assert.equal(storedProduct.ratingAverage, 0)

  const log = await AdminActivityLog.findOne({
    action: 'hide_review',
    targetId: review.data.review.id,
  }).lean()
  assert.ok(log)
})
