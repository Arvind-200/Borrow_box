import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12
export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 128

export async function hashPassword(password) {
  if (
    typeof password !== 'string' ||
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    throw Object.assign(
      new Error(`Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`),
      { status: 400 }
    )
  }

  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password, passwordHash) {
  if (typeof password !== 'string' || typeof passwordHash !== 'string') {
    return false
  }

  return bcrypt.compare(password, passwordHash)
}
