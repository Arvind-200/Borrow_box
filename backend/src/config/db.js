import mongoose from 'mongoose'
import { config } from './env.js'

let isConnected = false

export async function connectDB() {
  if (isConnected) {
    console.log('MongoDB already connected')
    return
  }

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })

    isConnected = true
    console.log(`MongoDB connected: ${conn.connection.host}`)

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err)
    })

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected')
      isConnected = false
    })

    process.on('SIGINT', async () => {
      await mongoose.connection.close()
      console.log('MongoDB connection closed due to app termination')
      process.exit(0)
    })

  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    throw error
  }
}

export function getConnectionStatus() {
  return {
    connected: isConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  }
}