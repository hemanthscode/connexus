import dotenv from 'dotenv'
dotenv.config()

// Validate required environment variables on startup
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI']
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
})

export const config = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/connexus',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  APP_NAME: process.env.APP_NAME || 'Connexus',
  API_VERSION: process.env.API_VERSION || 'v1'
}

export default config
