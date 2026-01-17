import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from './api/middleware/cors.js';
import morgan from 'morgan';
import { authLimiter, generalLimiter } from './api/middleware/rateLimiter.js';
import routes from './api/routes/index.js';
import errorHandler from './api/middleware/errorHandler.js';

const app = express();

// Trust proxy (required for Render, Heroku, etc.)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// Cross-origin resource sharing with configured whitelist
app.use(cors);

// HTTP request logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined')); // More detailed logging in production
}

// Body parsers - JSON and urlencoded with limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root endpoint - Handle both GET and HEAD
const rootHandler = (req, res) => {
  res.status(200).json({
    success: true,
    message: `Welcome to ${process.env.APP_NAME || 'Connexus'} API`,
    version: process.env.API_VERSION || 'v1',
    status: 'operational',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      api: '/api',
      docs: '/api/docs',
    },
  });
};

app.get('/', rootHandler);
app.head('/', rootHandler);

// Health check endpoint (before rate limiters) - Handle both GET and HEAD
const healthHandler = (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: `${process.env.APP_NAME || 'Connexus'} API running`,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
};

app.get('/api/health', healthHandler);
app.head('/api/health', healthHandler);

// Rate limit specific auth paths
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/users/me', authLimiter);

// General rate limiter for other API routes
app.use('/api', generalLimiter);

// API routes
app.use('/api', routes);

// Catch-all for undefined API routes (must be after all routes)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.path}`,
    suggestion: 'Check the API documentation for available endpoints',
  });
});

// Catch-all for non-API routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    availableRoutes: ['/', '/api/health', '/api'],
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;