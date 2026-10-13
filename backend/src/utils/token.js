import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import { ApiError } from './apiError.js'

export const TOKEN_COOKIE_NAME = 'token'
export const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60

// NOTE: sameSite 'lax' is correct for the local dev setup (Vite proxy makes
// the browser talk to the API same-origin). If production serves the frontend
// and API from different sites, cross-site usage would require
// sameSite: 'none' with secure: true — set deliberately, never by default.
export function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    path: '/',
    maxAge: TOKEN_TTL_SECONDS * 1000,
  }
}

export function getClearCookieOptions() {
  const { maxAge, ...rest } = getCookieOptions()
  return rest
}

export function signToken(userId) {
  if (!config.jwtSecret) {
    throw new ApiError(500, 'Authentication is not configured on the server')
  }

  // Only the user's ID is trusted from the token; role/status always come
  // from MongoDB on protected requests.
  return jwt.sign({ sub: String(userId) }, config.jwtSecret, {
    expiresIn: TOKEN_TTL_SECONDS,
  })
}

export function verifyToken(token) {
  if (!config.jwtSecret) {
    throw new ApiError(500, 'Authentication is not configured on the server')
  }

  try {
    return jwt.verify(token, config.jwtSecret)
  } catch {
    throw new ApiError(401, 'Your session is invalid or has expired. Please log in again.')
  }
}
