import mongoose from 'mongoose'
import { ApiError } from './apiError.js'

let transactionsSupported = null
let detectionPromise = null

export function isTransactionCapableHello(hello) {
  if (!hello || typeof hello !== 'object') return false
  return Boolean(hello.setName) || hello.msg === 'isdbgrid'
}

export async function detectTransactionsSupported() {
  if (transactionsSupported !== null) return transactionsSupported
  if (detectionPromise) return detectionPromise

  detectionPromise = (async () => {
    try {
      if (!mongoose.connection.db) return false
      const hello = await mongoose.connection.db.admin().command({ hello: 1 })
      transactionsSupported = isTransactionCapableHello(hello)
      return transactionsSupported
    } catch {
      transactionsSupported = false
      return false
    } finally {
      detectionPromise = null
    }
  })()

  return detectionPromise
}

export function setTransactionSupportForTests(value) {
  transactionsSupported = value
  detectionPromise = null
}

export async function assertTransactionsSupported() {
  const supported = await detectTransactionsSupported()
  if (!supported) {
    throw new ApiError(
      503,
      'Borrow request decisions are unavailable because this MongoDB deployment does not support transactions'
    )
  }
}

export async function withTransaction(work) {
  await assertTransactionsSupported()

  const session = await mongoose.startSession()
  try {
    let result
    await session.withTransaction(
      async () => {
        result = await work(session)
      },
      {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' },
      }
    )
    return result
  } catch (error) {
    if (/Transaction numbers are only allowed/i.test(error?.message || '')) {
      transactionsSupported = false
      throw new ApiError(
        503,
        'Borrow request decisions are unavailable because this MongoDB deployment does not support transactions'
      )
    }
    throw error
  } finally {
    await session.endSession()
  }
}
