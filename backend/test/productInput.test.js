import test from 'node:test'
import assert from 'node:assert/strict'
import { parseProductInput } from '../src/validators/productInput.js'

function validProduct(overrides = {}) {
  return {
    title: 'Cordless drill with bit set',
    description: 'A reliable cordless drill with a full bit set included.',
    category: 'a'.repeat(24),
    rentPerDay: 250,
    location: 'Riverside',
    tags: ['drill', 'DIY'],
    ...overrides,
  }
}

test('accepts product input without images', () => {
  const input = parseProductInput(validProduct())

  assert.deepEqual(input.images, [])
})

test('accepts uploaded paths and http(s) image URLs', () => {
  const input = parseProductInput(
    validProduct({
      images: [
        '/uploads/products/1720000000000-abc123.jpg',
        'https://example.com/photos/drill.png',
        'http://example.com/photos/drill.webp',
      ],
    })
  )

  assert.deepEqual(input.images, [
    '/uploads/products/1720000000000-abc123.jpg',
    'https://example.com/photos/drill.png',
    'http://example.com/photos/drill.webp',
  ])
})

test('trims image entries and removes duplicates', () => {
  const input = parseProductInput(
    validProduct({
      images: [
        '  /uploads/products/one.jpg  ',
        '/uploads/products/one.jpg',
        '/uploads/products/two.jpg',
      ],
    })
  )

  assert.deepEqual(input.images, [
    '/uploads/products/one.jpg',
    '/uploads/products/two.jpg',
  ])
})

test('rejects non-array and non-string image values', () => {
  assert.throws(
    () => parseProductInput(validProduct({ images: '/uploads/products/a.jpg' })),
    (error) => error.status === 400
  )
  assert.throws(
    () => parseProductInput(validProduct({ images: [42] })),
    (error) => error.status === 400
  )
})

test('rejects empty and non-http image references', () => {
  assert.throws(
    () => parseProductInput(validProduct({ images: ['   '] })),
    (error) => error.status === 400
  )
  assert.throws(
    () => parseProductInput(validProduct({ images: ['javascript:alert(1)'] })),
    (error) => error.status === 400
  )
  assert.throws(
    () => parseProductInput(validProduct({ images: ['data:image/png;base64,abc'] })),
    (error) => error.status === 400
  )
  assert.throws(
    () => parseProductInput(validProduct({ images: ['/uploads/../../secret.jpg'] })),
    (error) => error.status === 400
  )
})

test('rejects image URLs longer than 500 characters', () => {
  const longUrl = `https://example.com/${'a'.repeat(500)}.jpg`

  assert.throws(
    () => parseProductInput(validProduct({ images: [longUrl] })),
    (error) => error.status === 400
  )
})

test('rejects more than eight images', () => {
  const images = Array.from(
    { length: 9 },
    (_, index) => `https://example.com/image-${index}.jpg`
  )

  assert.throws(
    () => parseProductInput(validProduct({ images })),
    (error) => error.status === 400
  )
})
