import dotenv from 'dotenv'
dotenv.config()

export const MIN_JWT_SECRET_LENGTH = 32

const MAX_REPEATED_PATTERN_LENGTH = 16
const MIN_DISTINCT_CHARACTERS = 5

const KNOWN_INSECURE_JWT_SECRETS = new Set([
  'your-super-secret-jwt-key-change-in-production',
  'change-me',
  'secret',
])

function hasRepeatedPattern(value) {
  const maxPeriod = Math.min(MAX_REPEATED_PATTERN_LENGTH, Math.floor(value.length / 2))

  for (let period = 1; period <= maxPeriod; period += 1) {
    let repeats = true

    for (let index = period; index < value.length; index += 1) {
      if (value[index] !== value[index % period]) {
        repeats = false
        break
      }
    }

    if (repeats) return true
  }

  return false
}

function isClearlyPredictableSecret(value) {
  if (new Set(value).size < MIN_DISTINCT_CHARACTERS) return true
  return hasRepeatedPattern(value)
}

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/borrowbox',
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
}

export function validateConfig(configValues = config) {
  if (configValues.nodeEnv !== 'production') return

  if (typeof configValues.jwtSecret !== 'string' || configValues.jwtSecret.length === 0) {
    throw new Error('JWT_SECRET is required when NODE_ENV=production')
  }

  if (configValues.jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters when NODE_ENV=production`
    )
  }

  if (KNOWN_INSECURE_JWT_SECRETS.has(configValues.jwtSecret)) {
    throw new Error('JWT_SECRET must not use an example or default value when NODE_ENV=production')
  }

  if (isClearlyPredictableSecret(configValues.jwtSecret)) {
    throw new Error('JWT_SECRET must not be a predictable repeated or low-variety value when NODE_ENV=production')
  }
}
