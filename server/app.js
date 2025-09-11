import express from 'express'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import { config } from './config.js'

// Import routes
import authRoutes from './routes/auth.js'
import chatRoutes from './routes/chat.js'

// Import socket handlers
import { authenticateSocket, handleConnection } from './socket/socketHandlers.js'

console.log('🔧 Setting up Socket.IO...')

const app = express()
const server = http.createServer(app)

// Socket.IO setup with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: config.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
})

// Security middleware
app.use(helmet())

// CORS configuration
app.use(cors({
  origin: config.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Logging middleware
app.use(morgan('dev'))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later'
  }
})
app.use('/api', limiter)

// Socket.IO middleware and handlers
io.use(authenticateSocket)
io.on('connection', handleConnection(io))

// Make io accessible in routes
app.set('io', io)

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/chat', chatRoutes)

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    message: 'Connexus API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    socketConnections: io.engine.clientsCount
  }
  res.status(200).json(healthCheck)
})

// Database Status Endpoint
app.get('/api/db-status', async (req, res) => {
  try {
    const state = mongoose.connection.readyState
    const statusMap = {
      0: 'Disconnected',
      1: 'Connected', 
      2: 'Connecting',
      3: 'Disconnecting'
    }
    
    const dbStatus = {
      status: statusMap[state] || 'Unknown',
      state: state,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    }
    
    res.status(200).json(dbStatus)
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Database status check failed',
      error: error.message
    })
  }
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: config.NODE_ENV === 'development' ? err.message : 'Internal server error'
  })
})

// Database connection and server startup
const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    
    console.log('✅ MongoDB connected successfully')
    console.log(`   Host: ${mongoose.connection.host}`)
    console.log(`   Database: ${mongoose.connection.name}`)
    
    // Start server
    const serverInstance = server.listen(config.PORT, () => {
      console.log(`🚀 Server running on port ${config.PORT}`)
      console.log(`   Environment: ${config.NODE_ENV}`)
      console.log(`   API URL: http://localhost:${config.PORT}/api`)
      console.log(`   Socket.IO URL: ws://localhost:${config.PORT}/socket.io/`)
      console.log(`   Socket.IO Ready: ✅`)
    })
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully')
      serverInstance.close(() => {
        mongoose.connection.close()
        process.exit(0)
      })
    })
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message)
    process.exit(1)
  }
}

// Start the server
startServer()

export default app
