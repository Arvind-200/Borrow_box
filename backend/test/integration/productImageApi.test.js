import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
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
  apiRequest,
} from './helpers/testApi.js'
import {
  productsUploadsDir,
  MAX_IMAGE_BYTES,
} from '../../src/middleware/upload.js'

const enabled = integrationTestsEnabled()
const originalConsoleError = console.error
const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
])

let serverContext = null
const writtenFiles = new Set()

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

  await Promise.all(
    [...writtenFiles].map((file) => fs.rm(file, { force: true }))
  )
})

beforeEach(async () => {
  if (enabled) await clearTestDb()
})

function imageForm({ bytes = PNG_BYTES, type = 'image/png' } = {}) {
  const form = new FormData()
  form.append('image', new Blob([bytes], { type }), 'photo.png')
  return form
}

async function uploadImage(cookie, form) {
  const headers = {}
  if (cookie) headers.Cookie = cookie

  const response = await fetch(
    `${serverContext.baseUrl}/api/products/images`,
    { method: 'POST', headers, body: form }
  )
  const text = await response.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }
  return { response, data }
}

function productPayload(categoryId, images) {
  return {
    title: 'Canon EOS 200D Camera',
    description: 'A DSLR camera with a kit lens and carry bag included.',
    category: String(categoryId),
    rentPerDay: 500,
    location: 'Riverside',
    tags: ['camera', 'photography'],
    images,
  }
}

it('uploads an image, serves it, and stores it on a listing', async () => {
  const user = await createUser()
  const cookie = authCookie(user)
  const category = await createCategory()

  const upload = await uploadImage(cookie, imageForm())
  assert.equal(upload.response.status, 201)
  assert.match(upload.data.url, /^\/uploads\/products\/[a-z0-9-]+\.png$/)

  const filename = upload.data.url.split('/').pop()
  writtenFiles.add(path.join(productsUploadsDir, filename))

  const staticResponse = await fetch(
    `${serverContext.baseUrl}${upload.data.url}`
  )
  assert.equal(staticResponse.status, 200)
  assert.deepEqual(
    Buffer.from(await staticResponse.arrayBuffer()),
    PNG_BYTES
  )

  const created = await apiRequest(
    serverContext.baseUrl,
    '/api/products',
    {
      method: 'POST',
      cookie,
      payload: productPayload(category._id, [upload.data.url]),
    }
  )
  assert.equal(created.response.status, 201)
  assert.deepEqual(created.data.product.images, [upload.data.url])

  const detail = await apiRequest(
    serverContext.baseUrl,
    `/api/products/${created.data.product.id}`
  )
  assert.equal(detail.response.status, 200)
  assert.deepEqual(detail.data.product.images, [upload.data.url])

  const mine = await apiRequest(
    serverContext.baseUrl,
    '/api/products/mine',
    { cookie }
  )
  assert.equal(mine.response.status, 200)
  assert.deepEqual(mine.data.products[0].images, [upload.data.url])
})

it('rejects unauthenticated, non-image, and oversized uploads', async () => {
  const unauthenticated = await uploadImage(null, imageForm())
  assert.equal(unauthenticated.response.status, 401)

  const user = await createUser()
  const cookie = authCookie(user)

  const nonImage = await uploadImage(
    cookie,
    imageForm({ type: 'text/plain' })
  )
  assert.equal(nonImage.response.status, 400)
  assert.match(nonImage.data.message, /Only JPEG, PNG, WebP, or GIF/)

  const oversized = await uploadImage(
    cookie,
    imageForm({ bytes: Buffer.alloc(MAX_IMAGE_BYTES + 1, 1) })
  )
  assert.equal(oversized.response.status, 413)
  assert.match(oversized.data.message, /5 MB or smaller/)
})

it('rejects listings with invalid image references', async () => {
  const user = await createUser()
  const category = await createCategory()

  const { response, data } = await apiRequest(
    serverContext.baseUrl,
    '/api/products',
    {
      method: 'POST',
      cookie: authCookie(user),
      payload: productPayload(category._id, ['javascript:alert(1)']),
    }
  )

  assert.equal(response.status, 400)
  assert.match(data.message, /uploaded \/uploads\/ path or an http\(s\) URL/)
})
