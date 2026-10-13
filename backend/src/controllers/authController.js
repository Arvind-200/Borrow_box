import { User } from '../models/User.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { ApiError } from '../utils/apiError.js'
import {
  signToken,
  getCookieOptions,
  getClearCookieOptions,
  TOKEN_COOKIE_NAME,
} from '../utils/token.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Only public fields leave the server. passwordHash is never included.
function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body ?? {}

    // role and status are intentionally ignored: public signup can only
    // create a regular active account.

    if (typeof name !== 'string' || name.trim().length < 2) {
      throw new ApiError(400, 'Name is required (at least 2 characters)')
    }
    if (name.trim().length > 100) {
      throw new ApiError(400, 'Name cannot exceed 100 characters')
    }
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      throw new ApiError(400, 'A valid email address is required')
    }
    if (typeof password !== 'string' || password.length === 0) {
      throw new ApiError(400, 'Password is required')
    }

    const normalizedEmail = email.trim().toLowerCase()
    const trimmedName = name.trim()

    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      throw new ApiError(409, 'An account with this email already exists')
    }

    const passwordHash = await hashPassword(password)

    let user
    try {
      user = await User.create({
        name: trimmedName,
        email: normalizedEmail,
        passwordHash,
      })
    } catch (error) {
      // Handles the race condition where a duplicate email is inserted
      // between the check above and the create below.
      if (error && error.code === 11000) {
        throw new ApiError(409, 'An account with this email already exists')
      }
      throw error
    }

    res.status(201).json({ user: toPublicUser(user) })
  } catch (error) {
    next(error)
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body ?? {}

    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      throw new ApiError(400, 'A valid email address is required')
    }
    if (typeof password !== 'string' || password.length === 0) {
      throw new ApiError(400, 'Password is required')
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = await User.findOne({ email: normalizedEmail })

    // Same generic response for unknown email and wrong password so the
    // response never reveals which part failed.
    const invalidCredentials = new ApiError(401, 'Invalid email or password')

    if (!user) {
      throw invalidCredentials
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash)
    if (!passwordMatches) {
      throw invalidCredentials
    }

    if (user.status === 'blocked') {
      throw new ApiError(403, 'This account has been blocked')
    }

    const token = signToken(user._id)
    res.cookie(TOKEN_COOKIE_NAME, token, getCookieOptions())

    res.status(200).json({ user: toPublicUser(user) })
  } catch (error) {
    next(error)
  }
}

export function logout(req, res) {
  // Idempotent: clearing succeeds whether or not a cookie was sent.
  // MVP limitation: a copied JWT stays valid until it expires; clearing the
  // cookie only removes it from the browser.
  res.clearCookie(TOKEN_COOKIE_NAME, getClearCookieOptions())
  res.status(200).json({ message: 'Logged out successfully' })
}

export function me(req, res) {
  res.status(200).json({ user: toPublicUser(req.user) })
}
