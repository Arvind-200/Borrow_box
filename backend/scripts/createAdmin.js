import mongoose from 'mongoose'
import { connectDB } from '../src/config/db.js'
import { User } from '../src/models/User.js'
import { hashPassword } from '../src/utils/password.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function readAdminInput() {
  const name = (process.env.ADMIN_NAME || 'BorrowBox Admin').trim()
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD || ''

  if (!email || !EMAIL_PATTERN.test(email)) {
    throw new Error('ADMIN_EMAIL must be a valid email address')
  }

  if (!password) {
    throw new Error('ADMIN_PASSWORD is required')
  }

  return { name, email, password }
}

async function createAdmin() {
  const input = readAdminInput()
  await connectDB()

  const existing = await User.findOne({ email: input.email })

  if (existing) {
    const wasBlocked = existing.status !== 'active'
    const needsPromotion = existing.role !== 'admin'

    if (!needsPromotion && !wasBlocked) {
      console.log(`Admin account already exists: ${input.email}`)
      return
    }

    existing.role = 'admin'
    existing.status = 'active'
    await existing.save()

    if (needsPromotion) {
      console.log(
        `Promoted existing account to admin: ${input.email} (password unchanged)`
      )
    } else {
      console.log(`Reactivated blocked admin account: ${input.email}`)
    }

    return
  }

  const passwordHash = await hashPassword(input.password)

  await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: 'admin',
    status: 'active',
  })

  console.log(`Created admin account: ${input.email}`)
}

createAdmin()
  .catch((error) => {
    console.error('Admin bootstrap failed:', error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close()
    }
  })
