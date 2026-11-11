import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
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

async function createReviewTarget(reviewer) {
  const owner = await createUser()
  const product = await createProduct({ owner })
  const requestId = new mongoose.Types.ObjectId()

  return Review.create({
    borrowRequest: requestId,
    product: product._id,
    reviewer: reviewer._id,
    reviewee: owner._id,
    rating: 3,
    comment: 'The item was not as described.',
  })
}

function submitReport(cookie, payload) {
  return apiRequest(serverContext.baseUrl, '/api/reports', {
    method: 'POST',
    cookie,
    payload,
  })
}

it('requires authentication to submit a report', async () => {
  const { response } = await submitReport(undefined, {
    targetType: 'product',
    targetId: '64b7f6b1c2a4e8a1b2c3d4e5',
    reason: 'fake_listing',
  })
  assert.equal(response.status, 401)
})

it('creates a product report and blocks a duplicate open report', async () => {
  const reporter = await createUser()
  const owner = await createUser()
  const product = await createProduct({ owner })

  const payload = {
    targetType: 'product',
    targetId: String(product._id),
    reason: 'fake_listing',
    description: '  Photos do not match the item.  ',
  }

  const first = await submitReport(authCookie(reporter), payload)
  assert.equal(first.response.status, 201)
  assert.equal(first.data.report.targetType, 'product')
  assert.equal(first.data.report.targetId, String(product._id))
  assert.equal(first.data.report.reason, 'fake_listing')
  assert.equal(first.data.report.description, 'Photos do not match the item.')
  assert.equal(first.data.report.status, 'Open')
  assert.equal(JSON.stringify(first.data).includes('reporter'), false)

  const stored = await Report.findById(first.data.report.id).lean()
  assert.equal(String(stored.reporter), String(reporter._id))
  assert.equal(stored.targetModel, 'Product')

  const second = await submitReport(authCookie(reporter), payload)
  assert.equal(second.response.status, 409)
  assert.match(second.data.message, /already have an open report/i)
})

it('supports review and user reports', async () => {
  const reporter = await createUser()
  const review = await createReviewTarget(await createUser())
  const reportedUser = await createUser()

  const reviewReport = await submitReport(authCookie(reporter), {
    targetType: 'review',
    targetId: String(review._id),
    reason: 'offensive_content',
  })
  assert.equal(reviewReport.response.status, 201)
  assert.equal(reviewReport.data.report.targetType, 'review')

  const userReport = await submitReport(authCookie(reporter), {
    targetType: 'user',
    targetId: String(reportedUser._id),
    reason: 'scam_fraud',
  })
  assert.equal(userReport.response.status, 201)
  assert.equal(userReport.data.report.targetType, 'user')
})

it('blocks self-reports', async () => {
  const owner = await createUser()
  const product = await createProduct({ owner })
  const review = await createReviewTarget(owner)

  const ownProduct = await submitReport(authCookie(owner), {
    targetType: 'product',
    targetId: String(product._id),
    reason: 'other',
  })
  assert.equal(ownProduct.response.status, 409)
  assert.match(ownProduct.data.message, /own listing/i)

  const ownReview = await submitReport(authCookie(owner), {
    targetType: 'review',
    targetId: String(review._id),
    reason: 'other',
  })
  assert.equal(ownReview.response.status, 409)
  assert.match(ownReview.data.message, /own review/i)

  const selfUser = await submitReport(authCookie(owner), {
    targetType: 'user',
    targetId: String(owner._id),
    reason: 'other',
  })
  assert.equal(selfUser.response.status, 400)
  assert.match(selfUser.data.message, /report yourself/i)
})

it('rejects invalid reports and missing targets', async () => {
  const reporter = await createUser()

  const badReason = await submitReport(authCookie(reporter), {
    targetType: 'product',
    targetId: '64b7f6b1c2a4e8a1b2c3d4e5',
    reason: 'spam',
  })
  assert.equal(badReason.response.status, 400)

  const badTargetType = await submitReport(authCookie(reporter), {
    targetType: 'listing',
    targetId: '64b7f6b1c2a4e8a1b2c3d4e5',
    reason: 'fake_listing',
  })
  assert.equal(badTargetType.response.status, 400)

  const badTargetId = await submitReport(authCookie(reporter), {
    targetType: 'product',
    targetId: 'not-an-id',
    reason: 'fake_listing',
  })
  assert.equal(badTargetId.response.status, 400)

  const missing = await submitReport(authCookie(reporter), {
    targetType: 'product',
    targetId: '64b7f6b1c2a4e8a1b2c3d4e5',
    reason: 'fake_listing',
  })
  assert.equal(missing.response.status, 404)
})

it('rate limits report submissions per user', async () => {
  const reporter = await createUser()

  let lastStatus = null
  for (let attempt = 0; attempt < 11; attempt += 1) {
    const { response } = await submitReport(authCookie(reporter), {
      targetType: 'product',
      targetId: '64b7f6b1c2a4e8a1b2c3d4e5',
      reason: 'fake_listing',
    })
    lastStatus = response.status
  }

  assert.equal(lastStatus, 429)
})
