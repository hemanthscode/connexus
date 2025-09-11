import cors from 'cors'
import { config } from '../config.js'

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true)
    
    const allowedOrigins = [
      config.CLIENT_URL,
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://127.0.0.1:3000'
    ]
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 204
}

export default cors(corsOptions)
