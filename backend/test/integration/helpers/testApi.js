import app from '../../../src/app.js'
import { User } from '../../../src/models/User.js'
import { Category } from '../../../src/models/Category.js'
import { Product } from '../../../src/models/Product.js'
import { hashPassword } from '../../../src/utils/password.js'
import { signToken } from '../../../src/utils/token.js'

let userCounter = 0
let categoryCounter = 0
let cachedPasswordHash = null

async function getTestPasswordHash() {
  if (!cachedPasswordHash) {
    cachedPasswordHash = await hashPassword('TestPassword123!')
  }
  return cachedPasswordHash
}

export async function startTestServer() {
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const address = server.address()
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  }
}

export async function stopTestServer(server) {
  if (!server) return
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
}

export async function createUser(overrides = {}) {
  const passwordHash = await getTestPasswordHash()
  userCounter += 1

  return User.create({
    name: 'Test User',
    email: `test.user.${process.pid}.${Date.now()}.${userCounter}@example.com`,
    passwordHash,
    role: 'user',
    status: 'active',
    ...overrides,
  })
}

export function authCookie(user) {
  return `token=${signToken(user._id)}`
}

export async function createCategory(overrides = {}) {
  categoryCounter += 1

  return Category.create({
    name: `Test Category ${categoryCounter}`,
    slug: `test-category-${process.pid}-${categoryCounter}`,
    description: 'Category used by integration tests.',
    icon: 'box',
    ...overrides,
  })
}

export async function createProduct({ owner, category, ...overrides } = {}) {
  const resolvedCategory = category || (await createCategory())

  return Product.create({
    owner: owner?._id || owner,
    category: resolvedCategory?._id || resolvedCategory,
    title: 'Test Cordless Drill',
    description: 'A reliable test drill used for borrow request integration tests.',
    rentPerDay: 250,
    location: 'Test Area',
    availability: 'available',
    condition: 'good',
    ...overrides,
  })
}

export async function apiRequest(
  baseUrl,
  path,
  { method = 'GET', cookie, payload } = {}
) {
  const headers = {}
  if (payload !== undefined) headers['Content-Type'] = 'application/json'
  if (cookie) headers.Cookie = cookie

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
  })

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
