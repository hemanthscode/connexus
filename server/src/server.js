import http from 'http'
import mongoose from 'mongoose'
import { Server as SocketIOServer } from 'socket.io'
import { config } from './config/index.js'
import app from './app.js'
import { authenticateSocket } from './socket/socketAuth.js'
import { handleConnection } from './socket/socketHandlers.js'

const server = http.createServer(app)

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

app.set('io', io)

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
      serverInstance.close(async () => {
        await io.close()
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
