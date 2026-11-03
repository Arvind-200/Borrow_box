import test from 'node:test'
import assert from 'node:assert/strict'
import {
  parseProductQuery,
  parseLocationQuery,
} from '../src/validators/productQuery.js'
import { getNearbyAreaNames } from '../src/config/areaNeighbors.js'

test('parses location and availability filters', () => {
  const params = parseProductQuery({
    location: '  Riverside  ',
    availability: 'AVAILABLE',
  })

  assert.equal(params.location, 'Riverside')
  assert.equal(params.availability, 'available')
})

test('omits empty location and availability filters', () => {
  const params = parseProductQuery({
    location: '   ',
    availability: '',
  })

  assert.equal(params.location, undefined)
  assert.equal(params.availability, undefined)
})

test('rejects invalid availability values', () => {
  assert.throws(
    () => parseProductQuery({ availability: 'sold-out' }),
    (error) => error.status === 400
  )
})

test('rejects location values longer than 100 characters', () => {
  assert.throws(
    () => parseProductQuery({ location: 'a'.repeat(101) }),
    (error) => error.status === 400
  )
})

test('rejects duplicate or non-string location values', () => {
  assert.throws(
    () => parseProductQuery({ location: ['Riverside', 'Old Town'] }),
    (error) => error.status === 400
  )
})

test('keeps existing search, category, price, sort, and pagination behavior', () => {
  const params = parseProductQuery({
    q: 'drill',
    category: 'Tools',
    min: '100',
    max: '500',
    sort: 'price-asc',
    page: '2',
    limit: '6',
  })

  assert.deepEqual(params, {
    q: 'drill',
    category: 'tools',
    minPrice: 100,
    maxPrice: 500,
    availability: undefined,
    location: undefined,
    sort: 'price-asc',
    page: 2,
    limit: 6,
  })
})

test('parses location endpoint filters and nearbyFor', () => {
  const params = parseLocationQuery({
    q: 'camera',
    category: 'cameras',
    minPrice: '100',
    maxPrice: '900',
    availability: 'unavailable',
    nearbyFor: '  Riverside ',
  })

  assert.deepEqual(params, {
    q: 'camera',
    category: 'cameras',
    minPrice: 100,
    maxPrice: 900,
    availability: 'unavailable',
    nearbyFor: 'Riverside',
  })
})

test('rejects unknown nearbyFor values that are not strings', () => {
  assert.throws(
    () => parseLocationQuery({ nearbyFor: ['Riverside'] }),
    (error) => error.status === 400
  )
})

test('does not invent nearby areas', () => {
  assert.deepEqual(getNearbyAreaNames('Riverside'), [])
  assert.deepEqual(getNearbyAreaNames(''), [])
  assert.deepEqual(getNearbyAreaNames(undefined), [])
})
