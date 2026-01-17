import http from 'http';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './api/config/index.js';
import app from './app.js';
import { authenticateSocket } from './api/socket/socketAuth.js';
import { handleConnection } from './api/socket/socketHandlers.js';

const server = http.createServer(app);

// Socket.IO CORS configuration
const socketCorsOrigins = [
  config.CLIENT_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://connexus.vercel.app',
  /^https:\/\/connexus-.*\.vercel\.app$/,
].filter(Boolean);

const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      
      // Check exact match
      if (socketCorsOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Check regex patterns
      const allowedPattern = socketCorsOrigins.find(
        pattern => pattern instanceof RegExp && pattern.test(origin)
      );
      
      if (allowedPattern) {
        return callback(null, true);
      }
      
      callback(new Error('Socket.IO CORS not allowed'));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: config.SOCKET_PING_TIMEOUT || 60000,
  pingInterval: config.SOCKET_PING_INTERVAL || 25000,
  allowEIO3: true, // Allow Engine.IO v3 clients
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
    // MongoDB connection with updated options (no deprecated ones)
    await mongoose.connect(config.MONGODB_URI, {
      maxPoolSize: config.MONGODB_MAX_POOL_SIZE || 100,
      minPoolSize: config.MONGODB_MIN_POOL_SIZE || 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB connected:', mongoose.connection.host, mongoose.connection.name);

    const PORT = config.PORT || 5000;
    const serverInstance = server.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT} (${config.NODE_ENV})`);
      console.log(`📡 API URL: http://localhost:${PORT}/api`);
      console.log(`⚡ Socket.IO URL: ws://localhost:${PORT}/socket.io/`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received, shutting down gracefully...`);
      serverInstance.close(async () => {
        console.log('🔌 HTTP server closed');
        
        try {
          await io.close();
          console.log('🔌 Socket.IO closed');
          
          await mongoose.connection.close(false);
          console.log('🔌 MongoDB connection closed');
          
          console.log('✅ Graceful shutdown complete');
          process.exit(0);
        } catch (err) {
          console.error('❌ Error during shutdown:', err);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (err) => {
      console.error('❌ Unhandled Rejection:', err);
      gracefulShutdown('unhandledRejection');
    });

    // MongoDB connection error handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

startServer();