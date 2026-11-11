import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { Product } from '../../src/models/Product.js'
import { BorrowRequest } from '../../src/models/BorrowRequest.js'
import { Review } from '../../src/models/Review.js'
import { Report } from '../../src/models/Report.js'
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

function request(path, options = {}) {
  return apiRequest(serverContext.baseUrl, path, options)
}

function daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
}

async function createBorrowRequest({ product, owner, borrower, status }) {
  return BorrowRequest.create({
    product: product._id,
    owner: owner._id,
    borrower: borrower._id,
    startDate: daysFromNow(1),
    endDate: daysFromNow(3),
    status,
  })
}

it('protects every admin console read endpoint', async () => {
  const admin = await createUser({ role: 'admin' })
  const normalUser = await createUser()

  const paths = [
    '/api/admin/dashboard',
    '/api/admin/users',
    '/api/admin/products',
    '/api/admin/borrow-requests',
    '/api/admin/categories',
    '/api/admin/activity-logs',
    '/api/admin/settings',
  ]

  for (const path of paths) {
    const anonymous = await request(path)
    assert.equal(anonymous.response.status, 401, `${path} should require auth`)

    const forbidden = await request(path, { cookie: authCookie(normalUser) })
    assert.equal(forbidden.response.status, 403, `${path} should require admin`)

    const allowed = await request(path, { cookie: authCookie(admin) })
    assert.equal(allowed.response.status, 200, `${path} should allow admins`)
  }
})

it('returns dashboard metrics, trends, queue, and recent activity', async () => {
  const admin = await createUser({ role: 'admin', name: 'Admin One' })
  const owner = await createUser({ name: 'Owner One' })
  const borrower = await createUser({ name: 'Borrower One' })
  await createUser({ name: 'Blocked One', status: 'blocked' })

  const category = await createCategory({ name: 'Workshop' })
  const activeProduct = await createProduct({
    owner,
    category,
    title: 'Active Drill',
  })
  await createProduct({
    owner,
    category,
    title: 'Hidden Saw',
    moderationStatus: 'hidden',
  })
  await createProduct({
    owner,
    category,
    title: 'Removed Ladder',
    moderationStatus: 'removed',
  })
  await createProduct({
    owner,
    category,
    title: 'Draft Sander',
    isPublished: false,
  })

  const pending = await createBorrowRequest({
    product: activeProduct,
    owner,
    borrower,
    status: 'Pending',
  })
  const accepted = await createBorrowRequest({
    product: activeProduct,
    owner,
    borrower,
    status: 'Accepted',
  })
  const completedOne = await createBorrowRequest({
    product: activeProduct,
    owner,
    borrower,
    status: 'Completed',
  })
  const completedTwo = await createBorrowRequest({
    product: activeProduct,
    owner,
    borrower,
    status: 'Completed',
  })

  const visibleReview = await Review.create({
    borrowRequest: completedOne._id,
    product: activeProduct._id,
    reviewer: borrower._id,
    reviewee: owner._id,
    reviewerRole: 'borrower',
    rating: 5,
    comment: 'Great drill.',
  })
  await Review.create({
    borrowRequest: completedTwo._id,
    product: activeProduct._id,
    reviewer: borrower._id,
    reviewee: owner._id,
    reviewerRole: 'borrower',
    rating: 2,
    comment: 'Hidden review.',
    status: 'hidden',
  })

  await Report.create({
    reporter: borrower._id,
    targetType: 'product',
    targetModel: 'Product',
    targetId: activeProduct._id,
    reason: 'fake_listing',
  })
  await Report.create({
    reporter: borrower._id,
    targetType: 'review',
    targetModel: 'Review',
    targetId: visibleReview._id,
    reason: 'offensive_content',
    status: 'Resolved',
  })

  const warning = await request(`/api/admin/users/${borrower._id}/warn`, {
    method: 'PATCH',
    cookie: authCookie(admin),
    payload: { reason: 'First warning' },
  })
  assert.equal(warning.response.status, 200)

  const { response, data } = await request('/api/admin/dashboard', {
    cookie: authCookie(admin),
  })
  assert.equal(response.status, 200)

  assert.equal(data.metrics.users.total, 4)
  assert.equal(data.metrics.users.active, 3)
  assert.equal(data.metrics.users.blocked, 1)
  assert.equal(data.metrics.users.newThisWeek, 4)

  assert.equal(data.metrics.listings.total, 4)
  assert.equal(data.metrics.listings.active, 1)
  assert.equal(data.metrics.listings.hidden, 1)
  assert.equal(data.metrics.listings.removed, 1)

  assert.equal(data.metrics.requests.total, 4)
  assert.equal(data.metrics.requests.pending, 1)
  assert.equal(data.metrics.requests.accepted, 1)
  assert.equal(data.metrics.requests.completed, 2)
  assert.equal(data.metrics.requests.rejected, 0)

  assert.equal(data.metrics.reports.total, 2)
  assert.equal(data.metrics.reports.open, 1)
  assert.equal(data.metrics.reports.resolved, 1)

  assert.equal(data.metrics.reviews.total, 2)
  assert.equal(data.metrics.reviews.visible, 1)
  assert.equal(data.metrics.reviews.hidden, 1)

  assert.equal(data.metrics.categories.total, 1)
  assert.equal(data.metrics.categories.active, 1)

  assert.deepEqual(data.listingStatus, {
    active: 1,
    unpublished: 1,
    hidden: 1,
    removed: 1,
  })
  assert.deepEqual(data.listingMix, [{ name: 'Workshop', count: 1 }])
  assert.equal(data.requestsLast7Days.length, 7)
  assert.equal(
    data.requestsLast7Days.at(-1).total,
    4,
    'all requests were created today'
  )
  assert.equal(data.moderationQueue.length, 1)
  assert.equal(data.moderationQueue[0].status, 'Open')
  assert.equal(data.recentActivity.length, 1)
  assert.equal(data.recentActivity[0].action, 'warn_user')
  assert.equal(data.recentActivity[0].admin.name, 'Admin One')

  assert.ok(pending._id)
  assert.ok(accepted._id)
})

it('lists users with filters and returns detailed moderation statistics', async () => {
  const admin = await createUser({ role: 'admin' })
  const alice = await createUser({ name: 'Alice Borrower' })
  const bob = await createUser({ name: 'Bob Blocked', status: 'blocked' })
  const category = await createCategory()
  await createProduct({ owner: alice, category })
  await createProduct({ owner: alice, category, title: 'Second Listing' })

  const list = await request('/api/admin/users?q=alice', {
    cookie: authCookie(admin),
  })
  assert.equal(list.response.status, 200)
  assert.equal(list.data.pagination.total, 1)
  assert.equal(list.data.users[0].id, String(alice._id))
  assert.equal(list.data.users[0].email, alice.email)
  assert.equal(list.data.users[0].listingCount, 2)

  const blocked = await request('/api/admin/users?status=blocked', {
    cookie: authCookie(admin),
  })
  assert.equal(blocked.response.status, 200)
  assert.equal(blocked.data.pagination.total, 1)
  assert.equal(blocked.data.users[0].id, String(bob._id))

  const warned = await request(`/api/admin/users/${alice._id}/warn`, {
    method: 'PATCH',
    cookie: authCookie(admin),
    payload: { reason: 'Listed a duplicate item' },
  })
  assert.equal(warned.response.status, 200)

  const detail = await request(`/api/admin/users/${alice._id}`, {
    cookie: authCookie(admin),
  })
  assert.equal(detail.response.status, 200)
  assert.equal(detail.data.user.name, 'Alice Borrower')
  assert.equal(detail.data.user.warningCount, 1)
  assert.equal(detail.data.user.stats.listings, 2)
  assert.equal(detail.data.recentActivity.length, 1)
  assert.equal(detail.data.recentActivity[0].action, 'warn_user')
  assert.equal(detail.data.recentActivity[0].admin.name, admin.name)

  const invalid = await request('/api/admin/users/not-an-id', {
    cookie: authCookie(admin),
  })
  assert.equal(invalid.response.status, 400)

  const missing = await request('/api/admin/users/64b7f0c2a1b2c3d4e5f60718', {
    cookie: authCookie(admin),
  })
  assert.equal(missing.response.status, 404)
})

it('lists and filters admin listings with owner contact details', async () => {
  const admin = await createUser({ role: 'admin' })
  const owner = await createUser({ name: 'Listing Owner' })
  const firstCategory = await createCategory({ name: 'First Category' })
  const secondCategory = await createCategory({ name: 'Second Category' })

  const active = await createProduct({
    owner,
    category: firstCategory,
    title: 'Active Camera',
  })
  await createProduct({
    owner,
    category: secondCategory,
    title: 'Hidden Drill',
    moderationStatus: 'hidden',
  })
  await createProduct({
    owner,
    category: firstCategory,
    title: 'Removed Tent',
    moderationStatus: 'removed',
  })
  await createProduct({
    owner,
    category: firstCategory,
    title: 'Draft Kayak',
    isPublished: false,
  })

  const hidden = await request('/api/admin/products?moderationStatus=hidden', {
    cookie: authCookie(admin),
  })
  assert.equal(hidden.response.status, 200)
  assert.equal(hidden.data.pagination.total, 1)
  assert.equal(hidden.data.products[0].title, 'Hidden Drill')

  const byCategory = await request(
    `/api/admin/products?category=${firstCategory._id}`,
    { cookie: authCookie(admin) }
  )
  assert.equal(byCategory.response.status, 200)
  assert.equal(byCategory.data.pagination.total, 3)

  const bySearch = await request('/api/admin/products?q=Tent', {
    cookie: authCookie(admin),
  })
  assert.equal(bySearch.response.status, 200)
  assert.equal(bySearch.data.pagination.total, 1)
  assert.equal(bySearch.data.products[0].title, 'Removed Tent')

  const detail = await request(`/api/admin/products/${active._id}`, {
    cookie: authCookie(admin),
  })
  assert.equal(detail.response.status, 200)
  assert.equal(detail.data.product.owner.email, owner.email)
  assert.equal(detail.data.product.category.name, 'First Category')

  const invalid = await request('/api/admin/products/nope', {
    cookie: authCookie(admin),
  })
  assert.equal(invalid.response.status, 400)

  const missing = await request(
    '/api/admin/products/64b7f0c2a1b2c3d4e5f60718',
    { cookie: authCookie(admin) }
  )
  assert.equal(missing.response.status, 404)
})

it('lists every borrow request with status filtering', async () => {
  const admin = await createUser({ role: 'admin' })
  const owner = await createUser({ name: 'Request Owner' })
  const borrower = await createUser({ name: 'Request Borrower' })
  const category = await createCategory()
  const product = await createProduct({
    owner,
    category,
    title: 'Requested Projector',
  })

  await createBorrowRequest({
    product,
    owner,
    borrower,
    status: 'Pending',
  })
  await createBorrowRequest({
    product,
    owner,
    borrower,
    status: 'Completed',
  })

  const pending = await request('/api/admin/borrow-requests?status=pending', {
    cookie: authCookie(admin),
  })
  assert.equal(pending.response.status, 200)
  assert.equal(pending.data.pagination.total, 1)
  assert.equal(pending.data.requests[0].status, 'Pending')
  assert.equal(pending.data.requests[0].product.title, 'Requested Projector')
  assert.equal(pending.data.requests[0].borrower.name, 'Request Borrower')
  assert.equal(pending.data.requests[0].owner.name, 'Request Owner')

  const all = await request('/api/admin/borrow-requests', {
    cookie: authCookie(admin),
  })
  assert.equal(all.response.status, 200)
  assert.equal(all.data.pagination.total, 2)
  assert.equal(all.data.requests.length, 2)

  const invalid = await request(
    '/api/admin/borrow-requests?status=Shipped',
    { cookie: authCookie(admin) }
  )
  assert.equal(invalid.response.status, 400)
})

it('creates, updates, toggles, and audits categories', async () => {
  const admin = await createUser({ role: 'admin', name: 'Category Admin' })
  const owner = await createUser()

  const created = await request('/api/admin/categories', {
    method: 'POST',
    cookie: authCookie(admin),
    payload: {
      name: 'Power Tools',
      description: 'Drills, saws, and sanders.',
      sortOrder: 2,
    },
  })
  assert.equal(created.response.status, 201)
  assert.equal(created.data.category.slug, 'power-tools')
  assert.equal(created.data.category.isActive, true)
  const categoryId = created.data.category.id

  const duplicate = await request('/api/admin/categories', {
    method: 'POST',
    cookie: authCookie(admin),
    payload: { name: 'Another Name', slug: 'power-tools' },
  })
  assert.equal(duplicate.response.status, 409)

  const updated = await request(`/api/admin/categories/${categoryId}`, {
    method: 'PUT',
    cookie: authCookie(admin),
    payload: { name: 'Garden Tools', description: 'Outdoor tools.' },
  })
  assert.equal(updated.response.status, 200)
  assert.equal(updated.data.category.name, 'Garden Tools')
  assert.equal(updated.data.category.slug, 'garden-tools')

  const deactivated = await request(
    `/api/admin/categories/${categoryId}/active`,
    {
      method: 'PATCH',
      cookie: authCookie(admin),
      payload: { isActive: false },
    }
  )
  assert.equal(deactivated.response.status, 200)
  assert.equal(deactivated.data.category.isActive, false)

  await createProduct({ owner, category: { _id: categoryId } })

  const list = await request('/api/admin/categories', {
    cookie: authCookie(admin),
  })
  assert.equal(list.response.status, 200)
  assert.equal(list.data.count, 1)
  assert.equal(list.data.categories[0].isActive, false)
  assert.equal(list.data.categories[0].productCount, 1)

  const activated = await request(
    `/api/admin/categories/${categoryId}/active`,
    {
      method: 'PATCH',
      cookie: authCookie(admin),
      payload: { isActive: true },
    }
  )
  assert.equal(activated.response.status, 200)
  assert.equal(activated.data.category.isActive, true)

  const activity = await request(
    '/api/admin/activity-logs?targetType=category',
    { cookie: authCookie(admin) }
  )
  assert.equal(activity.response.status, 200)
  assert.equal(activity.data.pagination.total, 4)
  assert.deepEqual(
    new Set(activity.data.activities.map((item) => item.action)),
    new Set([
      'create_category',
      'update_category',
      'deactivate_category',
      'activate_category',
    ])
  )
  assert.equal(activity.data.activities[0].admin.name, 'Category Admin')

  const invalid = await request('/api/admin/categories/not-an-id', {
    method: 'PUT',
    cookie: authCookie(admin),
    payload: { name: 'Valid Name' },
  })
  assert.equal(invalid.response.status, 400)

  const missing = await request(
    '/api/admin/categories/64b7f0c2a1b2c3d4e5f60718',
    {
      method: 'PATCH',
      cookie: authCookie(admin),
      payload: { isActive: true },
    }
  )
  assert.equal(missing.response.status, 404)
})

it('updates platform settings and enforces the new listing switch', async () => {
  const admin = await createUser({ role: 'admin', name: 'Settings Admin' })
  const user = await createUser()
  const category = await createCategory()

  const defaults = await request('/api/admin/settings', {
    cookie: authCookie(admin),
  })
  assert.equal(defaults.response.status, 200)
  assert.equal(defaults.data.settings.siteName, 'BorrowBox')
  assert.equal(defaults.data.settings.allowNewListings, true)

  const updated = await request('/api/admin/settings', {
    method: 'PUT',
    cookie: authCookie(admin),
    payload: {
      siteName: 'BorrowBox Neighbourhood',
      supportEmail: 'HELP@Example.com',
      allowNewListings: false,
    },
  })
  assert.equal(updated.response.status, 200)
  assert.equal(updated.data.settings.siteName, 'BorrowBox Neighbourhood')
  assert.equal(updated.data.settings.supportEmail, 'help@example.com')
  assert.equal(updated.data.settings.allowNewListings, false)
  assert.equal(updated.data.settings.updatedBy.name, 'Settings Admin')

  const payload = {
    title: 'Blocked Listing',
    description: 'This listing should not be created while listings are paused.',
    category: String(category._id),
    rentPerDay: 100,
    location: 'Test Area',
  }

  const blocked = await request('/api/products', {
    method: 'POST',
    cookie: authCookie(user),
    payload,
  })
  assert.equal(blocked.response.status, 403)
  assert.match(blocked.data.message, /disabled by an administrator/)

  const reopened = await request('/api/admin/settings', {
    method: 'PUT',
    cookie: authCookie(admin),
    payload: { allowNewListings: true },
  })
  assert.equal(reopened.response.status, 200)
  assert.equal(reopened.data.settings.allowNewListings, true)

  const allowed = await request('/api/products', {
    method: 'POST',
    cookie: authCookie(user),
    payload,
  })
  assert.equal(allowed.response.status, 201)

  const invalidEmail = await request('/api/admin/settings', {
    method: 'PUT',
    cookie: authCookie(admin),
    payload: { supportEmail: 'not-an-email' },
  })
  assert.equal(invalidEmail.response.status, 400)

  const empty = await request('/api/admin/settings', {
    method: 'PUT',
    cookie: authCookie(admin),
    payload: {},
  })
  assert.equal(empty.response.status, 400)

  const activity = await request(
    '/api/admin/activity-logs?action=update_settings',
    { cookie: authCookie(admin) }
  )
  assert.equal(activity.response.status, 200)
  assert.equal(activity.data.pagination.total, 2)
  assert.equal(activity.data.activities[0].targetType, 'setting')
})
