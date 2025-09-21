import dotenv from 'dotenv'
import Joi from 'joi'

dotenv.config()

const envSchema = Joi.object({
  JWT_SECRET: Joi.string().min(32).required(),
  MONGODB_URI: Joi.string().uri().required(),
  PORT: Joi.number().default(5000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  CLIENT_URL: Joi.string().uri().default('http://localhost:3000'),
  JWT_EXPIRE: Joi.string().default('7d'),
  APP_NAME: Joi.string().default('Connexus'),
  API_VERSION: Joi.string().default('v1'),
}).unknown()

const { error, value: envVars } = envSchema.validate(process.env)

if (error) {
  console.error(`❌ Config validation error: ${error.message}`)
  process.exit(1)
}

export const config = {
  PORT: envVars.PORT,
  NODE_ENV: envVars.NODE_ENV,
  CLIENT_URL: envVars.CLIENT_URL,
  MONGODB_URI: envVars.MONGODB_URI,
  JWT_SECRET: envVars.JWT_SECRET,
  JWT_EXPIRE: envVars.JWT_EXPIRE,
  APP_NAME: envVars.APP_NAME,
  API_VERSION: envVars.API_VERSION,
}

export default config
