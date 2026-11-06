import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import express from 'express'
import app from '../src/app.js'
import { uploadProductImage as uploadProductImageController } from '../src/controllers/productController.js'
import {
  productsUploadsDir,
  uploadProductImage,
  MAX_IMAGE_BYTES,
} from '../src/middleware/upload.js'

const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
])

let apiServer
let apiBaseUrl
let uploadServer
let uploadBaseUrl
const writtenFiles = new Set()
const originalConsoleError = console.error

before(async () => {
  console.error = () => {}

  apiServer = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => apiServer.once('listening', resolve))
  apiBaseUrl = `http://127.0.0.1:${apiServer.address().port}`

  const uploadApp = express()
  uploadApp.post(
    '/upload',
    (req, res, next) => {
      req.user = { _id: 'test-user' }
      next()
    },
    uploadProductImage,
    uploadProductImageController
  )
  uploadApp.use((error, req, res, next) => {
    res.status(error.status || 500).json({ message: error.message })
  })

  uploadServer = uploadApp.listen(0, '127.0.0.1')
  await new Promise((resolve) => uploadServer.once('listening', resolve))
  uploadBaseUrl = `http://127.0.0.1:${uploadServer.address().port}`
})

after(async () => {
  console.error = originalConsoleError

  await Promise.all([
    new Promise((resolve, reject) => {
      uploadServer.close((error) => (error ? reject(error) : resolve()))
    }),
    new Promise((resolve, reject) => {
      apiServer.close((error) => (error ? reject(error) : resolve()))
    }),
  ])

  await Promise.all(
    [...writtenFiles].map((file) => fs.rm(file, { force: true }))
  )
})

function trackUploadedUrl(url) {
  const filename = url.split('/').pop()
  writtenFiles.add(path.join(productsUploadsDir, filename))
}

function imageForm({ bytes = PNG_BYTES, type = 'image/png', name = 'photo.png' } = {}) {
  const form = new FormData()
  form.append('image', new Blob([bytes], { type }), name)
  return form
}

async function upload(form, url = `${uploadBaseUrl}/upload`) {
  const response = await fetch(url, { method: 'POST', body: form })
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

test('upload endpoint rejects unauthenticated requests', async () => {
  const { response, data } = await upload(
    imageForm(),
    `${apiBaseUrl}/api/products/images`
  )

  assert.equal(response.status, 401)
  assert.match(data.message, /Authentication required/)
})

test('upload fails when no image field is provided', async () => {
  const { response, data } = await upload(new FormData())

  assert.equal(response.status, 400)
  assert.match(data.message, /image file is required/)
})

test('upload rejects non-image content types', async () => {
  const { response, data } = await upload(
    imageForm({ type: 'text/plain', name: 'notes.txt' })
  )

  assert.equal(response.status, 400)
  assert.match(data.message, /Only JPEG, PNG, WebP, or GIF/)
})

test('upload rejects files larger than 5 MB', async () => {
  const oversized = Buffer.alloc(MAX_IMAGE_BYTES + 1, 1)
  const { response, data } = await upload(
    imageForm({ bytes: oversized })
  )

  assert.equal(response.status, 413)
  assert.match(data.message, /5 MB or smaller/)
})

test('upload accepts a valid image and returns a public path', async () => {
  const { response, data } = await upload(imageForm())

  assert.equal(response.status, 201)
  assert.match(data.url, /^\/uploads\/products\/[a-z0-9-]+\.png$/)

  trackUploadedUrl(data.url)
  const saved = await fs.stat(
    path.join(productsUploadsDir, data.url.split('/').pop())
  )
  assert.equal(saved.size, PNG_BYTES.length)
})

test('uploaded files are served statically', async () => {
  const { data } = await upload(imageForm())
  trackUploadedUrl(data.url)

  const response = await fetch(`${apiBaseUrl}${data.url}`)
  const bytes = Buffer.from(await response.arrayBuffer())

  assert.equal(response.status, 200)
  assert.deepEqual(bytes, PNG_BYTES)
})
