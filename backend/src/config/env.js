import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/borrowbox',
  // No hardcoded fallback: if JWT_SECRET is missing the server starts but
  // auth endpoints fail safely (see src/utils/token.js).
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
}