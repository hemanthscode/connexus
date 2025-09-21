import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import helmet from 'helmet'
import cors from './api/middleware/cors.js'
import morgan from 'morgan'
import { authLimiter, generalLimiter } from './api/middleware/rateLimiter.js'
import routes from './api/routes/index.js'
import errorHandler from './api/middleware/errorHandler.js'

const app = express()

app.use(helmet())
app.use(cors)
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth/login', authLimiter)
app.use('/api/auth/me', authLimiter)
app.use('/api', generalLimiter)

app.use('/api', routes)

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: `${process.env.APP_NAME || 'Connexus'} API running`,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' })
})

app.use(errorHandler)

export default app
