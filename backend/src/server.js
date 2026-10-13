import app from './app.js'
import { config } from './config/env.js'
import { connectDB } from './config/db.js'

async function startServer() {
  try {
    await connectDB()

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