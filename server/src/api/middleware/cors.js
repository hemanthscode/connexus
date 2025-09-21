import cors from 'cors'
import { config } from '../../config/index.js'

const allowedOrigins = [config.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000']

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error('CORS not allowed'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
}

export default cors(corsOptions)
