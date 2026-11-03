import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import app from '../src/app.js'

let server
let baseUrl
const originalConsoleError = console.error

before(async () => {
  console.error = () => {}
  server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  console.error = originalConsoleError
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
})

test('rejects invalid availability before querying products', async () => {
  const response = await fetch(`${baseUrl}/api/products?availability=sold-out`)
  const body = await response.json()

  assert.equal(response.status, 400)
  assert.match(body.message, /availability must be one of/)
})

test('rejects duplicate location query parameters', async () => {
  const response = await fetch(`${baseUrl}/api/products?location=A&location=B`)
  const body = await response.json()

  assert.equal(response.status, 400)
  assert.match(body.message, /location must be a single value/)
})

test('routes the locations endpoint before the product id route', async () => {
  const response = await fetch(
    `${baseUrl}/api/products/locations?nearbyFor=A&nearbyFor=B`
  )
  const body = await response.json()

  assert.equal(response.status, 400)
  assert.match(body.message, /nearbyFor must be a single value/)
})
