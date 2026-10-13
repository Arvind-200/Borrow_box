import { Router } from 'express'
import { getConnectionStatus } from '../config/db.js'
import { config } from '../config/env.js'

const router = Router()

router.get('/health', (req, res) => {
  const dbStatus = getConnectionStatus()
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    database: {
      connected: dbStatus.connected,
      readyState: dbStatus.readyState,
    },
  })
})

export default router