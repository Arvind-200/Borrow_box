import app from './app.js'
import { config, validateConfig } from './config/env.js'
import { connectDB } from './config/db.js'
import { initializeBorrowRequestWorkflow } from './services/borrowRequestService.js'
import { initializeReviewWorkflow } from './services/reviewService.js'
import { Report } from './models/Report.js'
import { AdminActivityLog } from './models/AdminActivityLog.js'

async function startServer() {
  try {
    validateConfig()
    await connectDB()

    const borrowWorkflow = await initializeBorrowRequestWorkflow()
    console.log(
      `Borrow request transactions: ${
        borrowWorkflow.transactionsSupported ? 'enabled' : 'unavailable'
      }`
    )
    if (!borrowWorkflow.transactionsSupported) {
      console.warn(
        'Accept and cancel endpoints will return 503 until the MongoDB deployment supports transactions.'
      )
    }
    if (borrowWorkflow.productsUpdated > 0) {
      console.log(
        `Borrow availability reconciled for ${borrowWorkflow.productsUpdated} product(s).`
      )
    }

    await initializeReviewWorkflow()
    await Promise.all([Report.init(), AdminActivityLog.init()])

    const server = app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`)
      console.log(`Environment: ${config.nodeEnv}`)
      console.log(`Health check: http://localhost:${config.port}/api/health`)
    })

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${config.port} is already in use`)
      } else {
        console.error('Server error:', error)
      }
      process.exit(1)
    })

    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Rejection:', reason)
    })

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error)
      process.exit(1)
    })

  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()