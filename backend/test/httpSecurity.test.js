import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import app from '../src/app.js'

let server
let baseUrl
const originalConsoleError = console.error

before(async () => {
  console.error = (message, error) => {
    if (error?.status >= 500) originalConsoleError(message, error)
  }

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

function postJson(path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

test('responds with Helmet headers and without x-powered-by', async () => {
  const response = await fetch(`${baseUrl}/api/health`)

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('x-powered-by'), null)
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.ok(response.headers.get('content-security-policy'))
})

test('signup rate limit blocks the sixth attempt in an hour', async () => {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await postJson('/api/auth/signup', {})
    assert.equal(response.status, 400)
  }

  const blocked = await postJson('/api/auth/signup', {})
  assert.equal(blocked.status, 429)
  assert.equal((await blocked.json()).error, 'Too Many Requests')
})

test('login rate limit blocks the eleventh failed attempt in fifteen minutes', async () => {
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const response = await postJson('/api/auth/login', {})
    assert.equal(response.status, 400)
  }

  const blocked = await postJson('/api/auth/login', {})
  assert.equal(blocked.status, 429)
  assert.equal((await blocked.json()).error, 'Too Many Requests')
})
