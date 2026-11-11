import rateLimit from 'express-rate-limit'

const RATE_LIMIT_OPTIONS = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
}

function sendRateLimitResponse(res, message) {
  res.status(429).json({
    error: 'Too Many Requests',
    message,
  })
}

export const signupLimiter = rateLimit({
  ...RATE_LIMIT_OPTIONS,
  windowMs: 60 * 60 * 1000,
  limit: 5,
  handler: (req, res) => {
    sendRateLimitResponse(res, 'Too many signup attempts. Please try again later.')
  },
})

export const loginLimiter = rateLimit({
  ...RATE_LIMIT_OPTIONS,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    sendRateLimitResponse(res, 'Too many login attempts. Please try again later.')
  },
})

export const borrowRequestCreateLimiter = rateLimit({
  ...RATE_LIMIT_OPTIONS,
  windowMs: 60 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => String(req.user._id),
  handler: (req, res) => {
    sendRateLimitResponse(
      res,
      'Too many borrow request attempts. Please try again later.'
    )
  },
})

export const reviewCreateLimiter = rateLimit({
  ...RATE_LIMIT_OPTIONS,
  windowMs: 60 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => String(req.user._id),
  handler: (req, res) => {
    sendRateLimitResponse(
      res,
      'Too many review attempts. Please try again later.'
    )
  },
})

export const reportCreateLimiter = rateLimit({
  ...RATE_LIMIT_OPTIONS,
  windowMs: 60 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => String(req.user._id),
  handler: (req, res) => {
    sendRateLimitResponse(
      res,
      'Too many report attempts. Please try again later.'
    )
  },
})
