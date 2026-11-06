import test from 'node:test'
import assert from 'node:assert/strict'
import { isTransactionCapableHello } from '../src/utils/transactions.js'

test('detects a replica set as transaction capable', () => {
  assert.equal(
    isTransactionCapableHello({ setName: 'atlas-replset-shard-0' }),
    true
  )
})

test('detects a sharded cluster as transaction capable', () => {
  assert.equal(isTransactionCapableHello({ msg: 'isdbgrid' }), true)
})

test('rejects standalone and unknown hello responses', () => {
  assert.equal(isTransactionCapableHello({ ok: 1 }), false)
  assert.equal(isTransactionCapableHello({ setName: '' }), false)
  assert.equal(isTransactionCapableHello({ msg: 'isdbgrid-other' }), false)
})

test('rejects missing hello responses', () => {
  assert.equal(isTransactionCapableHello(null), false)
  assert.equal(isTransactionCapableHello(undefined), false)
  assert.equal(isTransactionCapableHello('replica-set'), false)
})
