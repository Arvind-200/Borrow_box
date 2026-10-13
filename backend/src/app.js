import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { config } from './config/env.js'
import healthRoutes from './routes/health.js'
import authRoutes from './routes/auth.js'

const app = express()

app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use('/api', healthRoutes)
app.use('/api/auth', authRoutes)

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  })
})

app.use((err, req, res, next) => {
  console.error('Error:', err)
  const status = err.status || 500
  res.status(status).json({
    error: err.name || 'Internal Server Error',
    message: config.nodeEnv === 'production' ? 'Something went wrong' : err.message,
  })
})

export default app