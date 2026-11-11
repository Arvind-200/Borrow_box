import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Product } from '../../src/models/Product.js'
import { BorrowRequest } from '../../src/models/BorrowRequest.js'
import { productsUploadsDir } from '../../src/middleware/upload.js'
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

function deleteRequest(productId, cookie) {
  return apiRequest(
    serverContext.baseUrl,
    `/api/products/${productId}`,
    { method: 'DELETE', cookie }
  )
}

async function createBorrowRequest(product, owner, borrower, status) {
  return BorrowRequest.create({
    product: product._id,
    owner: owner._id,
    borrower: borrower._id,
    startDate: '2026-11-10',
    endDate: '2026-11-12',
    status,
  })
}

it('rejects deletion when unauthenticated', async () => {
  const owner = await createUser()
  const product = await createProduct({ owner })

  const { response, data } = await deleteRequest(product._id)

  assert.equal(response.status, 401)
  assert.match(data.message, /authentication required/i)
  assert.ok(await Product.findById(product._id))
})

it('rejects an invalid product id', async () => {
  const owner = await createUser()

  const { response } = await deleteRequest('not-an-id', authCookie(owner))

  assert.equal(response.status, 400)
})

it('returns 404 for a missing product', async () => {
  const owner = await createUser()

  const { response } = await deleteRequest(
    '64b7f6b1c2a4e8a1b2c3d4e5',
    authCookie(owner)
  )

  assert.equal(response.status, 404)
})

it('forbids deleting another user listing', async () => {
  const owner = await createUser()
  const otherUser = await createUser()
  const product = await createProduct({ owner })

  const { response } = await deleteRequest(
    product._id,
    authCookie(otherUser)
  )

  assert.equal(response.status, 403)
  assert.ok(await Product.findById(product._id))
})

it('deletes an owned listing with no active requests', async () => {
  const owner = await createUser()
  const product = await createProduct({ owner })

  const { response, data } = await deleteRequest(
    product._id,
    authCookie(owner)
  )

  assert.equal(response.status, 204)
  assert.equal(data, null)
  assert.equal(await Product.findById(product._id), null)

  const detail = await apiRequest(
    serverContext.baseUrl,
    `/api/products/${product._id}`
  )
  assert.equal(detail.response.status, 404)
})

it('blocks deletion when the listing has a pending request', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const product = await createProduct({ owner })
  await createBorrowRequest(product, owner, borrower, 'Pending')

  const { response, data } = await deleteRequest(
    product._id,
    authCookie(owner)
  )

  assert.equal(response.status, 409)
  assert.match(data.message, /pending borrow requests/i)
  assert.ok(await Product.findById(product._id))
})

it('blocks deletion when the listing has an accepted request', async () => {
  const owner = await createUser()
  const borrower = await createUser()
  const product = await createProduct({ owner, availability: 'unavailable' })
  await createBorrowRequest(product, owner, borrower, 'Accepted')

  const { response, data } = await deleteRequest(
    product._id,
    authCookie(owner)
  )

  assert.equal(response.status, 409)
  assert.match(data.message, /currently borrowed/i)
  assert.ok(await Product.findById(product._id))
})

it('removes local uploaded image files with the deleted listing', async () => {
  const owner = await createUser()
  const filename = `delete-test-${process.pid}-${Date.now()}.png`
  const file = path.join(productsUploadsDir, filename)
  await fs.writeFile(file, Buffer.from([0x89, 0x50, 0x4e, 0x47]))

  const product = await createProduct({
    owner,
    images: [`/uploads/products/${filename}`],
  })

  try {
    const { response } = await deleteRequest(
      product._id,
      authCookie(owner)
    )

    assert.equal(response.status, 204)
    await assert.rejects(fs.access(file))
  } finally {
    await fs.rm(file, { force: true })
  }
})
