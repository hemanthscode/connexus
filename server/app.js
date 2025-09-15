// connexus-server/app.js
import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import helmet from 'helmet'
import cors from './middleware/cors.js'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import { config } from './config.js'
import authRoutes from './routes/auth.js'
import chatRoutes from './routes/chat.js'
import { authenticateSocket, handleConnection } from './socket/socketHandlers.js'

const app = express()
const server = http.createServer(app)

// Initialize socket.io with cors and websocket transport
const io = new SocketIOServer(server, {
  cors: {
    origin: config.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})

io.use(authenticateSocket)
io.on('connection', handleConnection(io))

// Middleware
app.use(helmet())
app.use(cors)
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Rate limiting strategies

// More strict rate limiter for auth endpoints (login, profile)
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per IP per minute for auth routes
  message: { error: 'Too many auth requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// General limiter for all other API routes
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1500, // 1500 requests per IP per minute
  message: { error: 'Too many requests in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Apply authLimiter only to auth routes that are sensitive
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/me', authLimiter)

// Apply generalLimiter to all other /api routes
app.use('/api', generalLimiter)

// Make io accessible via app locals
app.set('io', io)

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/chat', chatRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: `${config.APP_NAME} API running`,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    socketConnections: io.engine.clientsCount,
  })
})

// Database status endpoint
app.get('/api/db-status', async (req, res) => {
  try {
    const state = mongoose.connection.readyState
    const statusMap = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting',
    }
    res.json({
      status: statusMap[state] || 'Unknown',
      state,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
    })
  } catch (error) {
    res.status(500).json({ status: 'Error', message: 'Database status failed', error: error.message })
  }
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' })
})

// Global error handler with structured logging
app.use((err, req, res, next) => {
  console.error(
    JSON.stringify({
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    })
  )
  res.status(err.statusCode || 500).json({
    success: false,
    message: config.NODE_ENV === 'development' ? err.message : 'Internal server error',
  })
})

// Connect to DB and start server with graceful shutdown
const startServer = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    console.log('MongoDB connected:', mongoose.connection.host, mongoose.connection.name)

    const serverInstance = server.listen(config.PORT, () => {
      console.log(`Server listening on port ${config.PORT} (${config.NODE_ENV})`)
      console.log(`API URL: http://localhost:${config.PORT}/api`)
      console.log(`Socket.IO URL: ws://localhost:${config.PORT}/socket.io/`)
    })

    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully')
      // Stop accepting new connections on HTTP server
      serverInstance.close(async () => {
        // Disconnect socket.io server
        await io.close()
        // Close mongodb connection
        await mongoose.connection.close(false)
        console.log('MongoDB connection closed, exiting process.')
        process.exit(0)
      })
    })
  } catch (error) {
    console.error('Server startup failed:', error)
    process.exit(1)
  }
}

startServer()

export default app
