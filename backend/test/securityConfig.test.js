import test from 'node:test'
import assert from 'node:assert/strict'
import { MIN_JWT_SECRET_LENGTH, validateConfig } from '../src/config/env.js'
import { hashPassword } from '../src/utils/password.js'

test('validateConfig allows development without JWT_SECRET', () => {
  assert.doesNotThrow(() => {
    validateConfig({ nodeEnv: 'development', jwtSecret: undefined })
  })
})

test('validateConfig rejects a missing production JWT_SECRET', () => {
  assert.throws(
    () => validateConfig({ nodeEnv: 'production', jwtSecret: undefined }),
    /JWT_SECRET is required/
  )
})

test('validateConfig rejects a short production JWT_SECRET', () => {
  assert.throws(
    () => validateConfig({ nodeEnv: 'production', jwtSecret: 'x'.repeat(MIN_JWT_SECRET_LENGTH - 1) }),
    /at least 32 characters/
  )
})

test('validateConfig accepts a high-variety production JWT_SECRET of the minimum length', () => {
  assert.doesNotThrow(() => {
    validateConfig({
      nodeEnv: 'production',
      jwtSecret: 'vN7#qL2!sR9$wT4%yU6^zA8&cE1*gH5@kM2!',
    })
  })
})

test('validateConfig rejects the example production JWT_SECRET', () => {
  assert.throws(
    () => validateConfig({
      nodeEnv: 'production',
      jwtSecret: 'your-super-secret-jwt-key-change-in-production',
    }),
    /example or default/
  )
})

test('validateConfig rejects a production JWT_SECRET with one repeated character', () => {
  assert.throws(
    () => validateConfig({ nodeEnv: 'production', jwtSecret: 'x'.repeat(MIN_JWT_SECRET_LENGTH) }),
    /predictable repeated or low-variety/
  )
})

test('validateConfig rejects a production JWT_SECRET with a repeated short pattern', () => {
  assert.throws(
    () => validateConfig({ nodeEnv: 'production', jwtSecret: 'abcd'.repeat(8) }),
    /predictable repeated or low-variety/
  )
})

test('validateConfig rejects a repeated numeric sequence as a production JWT_SECRET', () => {
  assert.throws(
    () => validateConfig({ nodeEnv: 'production', jwtSecret: '0123456789'.repeat(3) + '01' }),
    /predictable repeated or low-variety/
  )
})

test('validateConfig rejects a low-variety production JWT_SECRET', () => {
  assert.throws(
    () => validateConfig({ nodeEnv: 'production', jwtSecret: 'a'.repeat(31) + 'b' }),
    /predictable repeated or low-variety/
  )
})

test('password hashing rejects values outside the backend 8-128 range', async () => {
  await assert.rejects(hashPassword('short77'), /between 8 and 128 characters/)
  await assert.rejects(hashPassword('x'.repeat(129)), /between 8 and 128 characters/)
})
