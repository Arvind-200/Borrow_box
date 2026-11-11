import mongoose from 'mongoose'
import { config } from '../../../src/config/env.js'
import { User } from '../../../src/models/User.js'
import { Category } from '../../../src/models/Category.js'
import { Product } from '../../../src/models/Product.js'
import { BorrowRequest } from '../../../src/models/BorrowRequest.js'
import { Review } from '../../../src/models/Review.js'
import { Report } from '../../../src/models/Report.js'
import { AdminActivityLog } from '../../../src/models/AdminActivityLog.js'
import { PlatformSetting } from '../../../src/models/PlatformSetting.js'

const TEST_DB_PREFIX = 'borrowbox_test_'
const RESERVED_DATABASE_NAMES = new Set(['test', 'borrowbox', 'admin', 'local', 'config'])

let connected = false

export function integrationTestsEnabled() {
  return process.env.RUN_DB_TESTS === '1'
}

export async function connectTestDb() {
  if (!integrationTestsEnabled()) return null
  if (connected) return mongoose.connection.name

  const derivedName = `${TEST_DB_PREFIX}${process.pid}_${Date.now()}`
  const uri = process.env.MONGODB_TEST_URI || config.mongoUri
  const options = process.env.MONGODB_TEST_URI
    ? { serverSelectionTimeoutMS: 15000, maxPoolSize: 5 }
    : { dbName: derivedName, serverSelectionTimeoutMS: 15000, maxPoolSize: 5 }

  await mongoose.connect(uri, options)

  const databaseName = mongoose.connection.name
  const hasSafePrefix = databaseName.startsWith(TEST_DB_PREFIX)
  const isReserved = RESERVED_DATABASE_NAMES.has(databaseName)

  if (!hasSafePrefix || isReserved) {
    await mongoose.disconnect()
    throw new Error(
      `Refusing to run integration tests against unsafe database "${databaseName}". ` +
        `Use a database name beginning with "${TEST_DB_PREFIX}".`
    )
  }

  await Promise.all([
    User.init(),
    Category.init(),
    Product.init(),
    BorrowRequest.init(),
    Review.init(),
    Report.init(),
    AdminActivityLog.init(),
    PlatformSetting.init(),
  ])

  connected = true
  return databaseName
}

export async function clearTestDb() {
  if (!connected) return

  await Promise.all([
    PlatformSetting.deleteMany({}),
    AdminActivityLog.deleteMany({}),
    Report.deleteMany({}),
    Review.deleteMany({}),
    BorrowRequest.deleteMany({}),
    Product.deleteMany({}),
    Category.deleteMany({}),
    User.deleteMany({}),
  ])
}

export async function disconnectTestDb() {
  if (!connected) return

  try {
    await mongoose.connection.dropDatabase()
  } finally {
    connected = false
    await mongoose.disconnect()
  }
}
