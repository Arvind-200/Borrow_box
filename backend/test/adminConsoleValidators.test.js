import test from 'node:test'
import assert from 'node:assert/strict'
import { parseAdminUserQuery } from '../src/validators/adminUserQuery.js'
import { parseAdminProductQuery } from '../src/validators/adminProductQuery.js'
import { parseAdminBorrowRequestQuery } from '../src/validators/adminBorrowRequestQuery.js'
import { parseAdminActivityQuery } from '../src/validators/adminActivityQuery.js'
import {
  parseCategoryActiveInput,
  parseCategoryCreateInput,
  parseCategoryUpdateInput,
  slugifyCategoryName,
} from '../src/validators/categoryInput.js'
import { parsePlatformSettingInput } from '../src/validators/platformSettingInput.js'

test('admin user query applies pagination defaults and filters', () => {
  assert.deepEqual(parseAdminUserQuery({}), {
    page: 1,
    limit: 20,
    q: undefined,
    role: undefined,
    status: undefined,
  })

  assert.deepEqual(
    parseAdminUserQuery({ page: '2', limit: '50', q: '  ada  ', role: 'admin', status: 'blocked' }),
    { page: 2, limit: 50, q: 'ada', role: 'admin', status: 'blocked' }
  )
})

test('admin user query rejects invalid pagination and enums', () => {
  assert.throws(() => parseAdminUserQuery({ page: '0' }), /page/)
  assert.throws(() => parseAdminUserQuery({ limit: '51' }), /limit/)
  assert.throws(() => parseAdminUserQuery({ role: 'owner' }), /role/)
  assert.throws(() => parseAdminUserQuery({ status: 'pending' }), /status/)
  assert.throws(() => parseAdminUserQuery({ q: 'x'.repeat(101) }), /q/)
})

test('admin product query accepts moderation, availability, and category filters', () => {
  const category = '64b7f0c2a1b2c3d4e5f60718'
  assert.deepEqual(
    parseAdminProductQuery({
      moderationStatus: 'hidden',
      availability: 'unavailable',
      category,
      page: '3',
    }),
    {
      page: 3,
      limit: 20,
      q: undefined,
      moderationStatus: 'hidden',
      availability: 'unavailable',
      category,
    }
  )

  assert.throws(
    () => parseAdminProductQuery({ moderationStatus: 'deleted' }),
    /moderationStatus/
  )
  assert.throws(
    () => parseAdminProductQuery({ availability: 'maybe' }),
    /availability/
  )
  assert.throws(
    () => parseAdminProductQuery({ category: 'not-an-id' }),
    /category/
  )
})

test('admin borrow request query normalizes the lifecycle status', () => {
  assert.deepEqual(parseAdminBorrowRequestQuery({ status: 'accepted' }), {
    page: 1,
    limit: 20,
    status: 'Accepted',
  })
  assert.throws(
    () => parseAdminBorrowRequestQuery({ status: 'Returned' }),
    /status/
  )
})

test('admin activity query accepts known actions and target types', () => {
  assert.deepEqual(
    parseAdminActivityQuery({
      action: 'hide_product',
      targetType: 'product',
      limit: '10',
    }),
    { page: 1, limit: 10, action: 'hide_product', targetType: 'product' }
  )
  assert.throws(
    () => parseAdminActivityQuery({ action: 'delete_everything' }),
    /action/
  )
  assert.throws(
    () => parseAdminActivityQuery({ targetType: 'order' }),
    /targetType/
  )
})

test('category slugs are generated and validated', () => {
  assert.equal(slugifyCategoryName('  Power Tools & DIY  '), 'power-tools-diy')

  const created = parseCategoryCreateInput({
    name: '  Camping Gear ',
    description: ' Tents and stoves ',
    sortOrder: '4',
  })
  assert.equal(created.name, 'Camping Gear')
  assert.equal(created.slug, 'camping-gear')
  assert.equal(created.description, 'Tents and stoves')
  assert.equal(created.icon, 'box')
  assert.equal(created.sortOrder, 4)
  assert.equal(created.isActive, true)

  assert.throws(
    () => parseCategoryCreateInput({ name: 'Bad', slug: 'Not A Slug' }),
    /slug/
  )
  assert.throws(() => parseCategoryCreateInput({ name: 'A' }), /at least 2/)
  assert.throws(
    () => parseCategoryCreateInput({ name: 'Good', sortOrder: -1 }),
    /sortOrder/
  )
})

test('category updates require at least one valid field and regenerate slug from name', () => {
  assert.deepEqual(parseCategoryUpdateInput({ name: 'Garden Tools' }), {
    name: 'Garden Tools',
    slug: 'garden-tools',
  })

  assert.deepEqual(parseCategoryUpdateInput({ description: 'Updated text' }), {
    description: 'Updated text',
  })

  assert.throws(() => parseCategoryUpdateInput({}), /At least one/)
  assert.throws(
    () => parseCategoryUpdateInput({ isActive: 'yes' }),
    /isActive/
  )
  assert.deepEqual(parseCategoryActiveInput({ isActive: false }), {
    isActive: false,
  })
  assert.throws(() => parseCategoryActiveInput({}), /required/)
})

test('platform settings input trims and validates fields', () => {
  assert.deepEqual(
    parsePlatformSettingInput({
      siteName: '  BorrowBox Local ',
      supportEmail: '  HELP@Example.com ',
      allowNewListings: false,
    }),
    {
      siteName: 'BorrowBox Local',
      supportEmail: 'help@example.com',
      allowNewListings: false,
    }
  )

  assert.deepEqual(parsePlatformSettingInput({ supportEmail: '' }), {
    supportEmail: '',
  })
  assert.throws(
    () => parsePlatformSettingInput({ supportEmail: 'not-an-email' }),
    /valid email/
  )
  assert.throws(
    () => parsePlatformSettingInput({ allowNewListings: 'false' }),
    /true or false/
  )
  assert.throws(() => parsePlatformSettingInput({}), /At least one/)
})
