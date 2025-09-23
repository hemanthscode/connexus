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

// Security headers
app.use(helmet());

// Cross-origin resource sharing with configured whitelist
app.use(cors);

// HTTP request logger for dev environment only
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsers - JSON and urlencoded with limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limit specific auth paths
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/me', authLimiter);

// General rate limiter for other API routes
app.use('/api', generalLimiter);

// API routes
app.use('/api', routes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: `${process.env.APP_NAME || 'Connexus'} API running`,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Catch-all for undefined API routes
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Error handling middleware
app.use(errorHandler);

export default app;
