import cors from 'cors';
import { config } from '../config/index.js';

const allowedOrigins = [
  config.CLIENT_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  // Add your Vercel production URL here
  'https://connexus.vercel.app',
  // Also allow preview deployments
  /^https:\/\/connexus-.*\.vercel\.app$/,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    // Check exact match
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check regex patterns for Vercel preview deployments
    const allowedPattern = allowedOrigins.find(
      pattern => pattern instanceof RegExp && pattern.test(origin)
    );
    
    if (allowedPattern) {
      return callback(null, true);
    }
    
    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600, // Cache preflight for 10 minutes
};

export default cors(corsOptions);