import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { config } from './config/env.js'
import healthRoutes from './routes/health.js'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import categoryRoutes from './routes/categories.js'
import borrowRequestRoutes from './routes/borrowRequests.js'
import reviewRoutes from './routes/reviews.js'
import reportRoutes from './routes/reports.js'
import adminReviewRoutes from './routes/adminReviews.js'
import adminReportRoutes from './routes/adminReports.js'
import adminProductRoutes from './routes/adminProducts.js'
import adminUserRoutes from './routes/adminUsers.js'
import adminDashboardRoutes from './routes/adminDashboard.js'
import adminBorrowRequestRoutes from './routes/adminBorrowRequests.js'
import adminActivityLogRoutes from './routes/adminActivityLogs.js'
import adminCategoryRoutes from './routes/adminCategories.js'
import adminSettingRoutes from './routes/adminSettings.js'
import { uploadsDir } from './middleware/upload.js'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const frontendDist = path.resolve(currentDirectory, '../../frontend/dist')

const app = express()

app.disable('x-powered-by')

// Render terminates TLS and forwards requests through one proxy.
if (config.nodeEnv === 'production') {
  app.set('trust proxy', 1)
}

app.use(helmet())

app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use('/uploads', express.static(uploadsDir))

app.use('/api', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/borrow-requests', borrowRequestRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/admin/dashboard', adminDashboardRoutes)
app.use('/api/admin/reviews', adminReviewRoutes)
app.use('/api/admin/reports', adminReportRoutes)
app.use('/api/admin/products', adminProductRoutes)
app.use('/api/admin/users', adminUserRoutes)
app.use('/api/admin/borrow-requests', adminBorrowRequestRoutes)
app.use('/api/admin/activity-logs', adminActivityLogRoutes)
app.use('/api/admin/categories', adminCategoryRoutes)
app.use('/api/admin/settings', adminSettingRoutes)

if (fs.existsSync(path.join(frontendDist, 'index.html'))) {
  app.use(express.static(frontendDist))

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next()
    }
    res.sendFile(path.join(frontendDist, 'index.html'))
  })
}

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