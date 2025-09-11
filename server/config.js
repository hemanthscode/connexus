import dotenv from 'dotenv'

dotenv.config()

export const config = {
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  
  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/connexus',
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  
  // App Configuration
  APP_NAME: process.env.APP_NAME || 'Connexus',
  API_VERSION: process.env.API_VERSION || 'v1'
}

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI']

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
})

export default config
