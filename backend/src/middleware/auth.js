import { User } from '../models/User.js'
import { verifyToken, TOKEN_COOKIE_NAME } from '../utils/token.js'
import { ApiError } from '../utils/apiError.js'

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[TOKEN_COOKIE_NAME]
    if (!token) {
      throw new ApiError(401, 'Authentication required')
    }

    const payload = verifyToken(token)
    const user = await User.findById(payload.sub)

    if (!user) {
      throw new ApiError(401, 'Account not found')
    }
    if (user.status === 'blocked') {
      throw new ApiError(403, 'This account has been blocked')
    }

    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}
