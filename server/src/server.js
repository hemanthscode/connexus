import http from 'http';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './api/config/index.js';
import app from './app.js';
import { authenticateSocket } from './api/socket/socketAuth.js';
import { handleConnection } from './api/socket/socketHandlers.js';

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: config.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: config.SOCKET_PING_TIMEOUT,
  pingInterval: config.SOCKET_PING_INTERVAL,
});

// Socket.IO authentication middleware
io.use(authenticateSocket);

// On new connection, run handlers
io.on('connection', handleConnection(io));

// Attach io instance to express app for accessibility
app.set('io', io);

/**
 * Start HTTP server and connect to MongoDB.
 * Sets up graceful shutdown on SIGTERM.
 */
const startServer = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: config.MONGODB_MAX_POOL_SIZE,
      minPoolSize: config.MONGODB_MIN_POOL_SIZE,
    });
    console.log('MongoDB connected:', mongoose.connection.host, mongoose.connection.name);

    const serverInstance = server.listen(config.PORT, () => {
      console.log(`🚀 Server listening on port ${config.PORT} (${config.NODE_ENV})`);
      console.log(`📡 API URL: http://localhost:${config.PORT}/api`);
      console.log(`⚡ Socket.IO URL: ws://localhost:${config.PORT}/socket.io/`);
      console.log(`🏥 Health Check: http://localhost:${config.PORT}/api/health`);
    });

    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully');
      serverInstance.close(async () => {
        await io.close();
        await mongoose.connection.close(false);
        console.log('MongoDB connection closed, exiting process.');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully');
      serverInstance.close(async () => {
        await io.close();
        await mongoose.connection.close(false);
        console.log('MongoDB connection closed, exiting process.');
        process.exit(0);
      });
    });

    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      process.exit(1);
    });

    process.on('unhandledRejection', (err) => {
      console.error('Unhandled Rejection:', err);
      process.exit(1);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

startServer();
