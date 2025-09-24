import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const envSchema = Joi.object({
  JWT_SECRET: Joi.string().min(32).required().description('Secret key for JWT signing'),
  MONGODB_URI: Joi.string().uri().required().description('MongoDB connection URI'),
  PORT: Joi.number().default(5000).description('Server listening port'),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  CLIENT_URL: Joi.string().uri().default('http://localhost:3000').description('Allowed client URL for CORS'),
  JWT_EXPIRE: Joi.string().default('7d').description('JWT token expiry duration'),
  JWT_REFRESH_EXPIRE: Joi.string().default('30d').description('JWT refresh token expiry duration'),
  APP_NAME: Joi.string().default('Connexus').description('Application name'),
  API_VERSION: Joi.string().default('v1').description('API version prefix'),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(60000).description('Rate limit window in milliseconds'),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(1000).description('Max requests per rate limit window'),
  SOCKET_PING_TIMEOUT: Joi.number().default(60000).description('Socket.IO ping timeout duration'),
  SOCKET_PING_INTERVAL: Joi.number().default(25000).description('Socket.IO ping interval'),
  MONGODB_MAX_POOL_SIZE: Joi.number().default(100).description('MongoDB max connection pool size'),
  MONGODB_MIN_POOL_SIZE: Joi.number().default(5).description('MongoDB min connection pool size'),
})
  .unknown();

const { error, value: envVars } = envSchema.validate(process.env, { abortEarly: false });

if (error) {
  console.error(`❌ Config validation error: ${error.message}`);
  process.exit(1);
}

export const config = {
  PORT: envVars.PORT,
  NODE_ENV: envVars.NODE_ENV,
  CLIENT_URL: envVars.CLIENT_URL,
  MONGODB_URI: envVars.MONGODB_URI,
  JWT_SECRET: envVars.JWT_SECRET,
  JWT_EXPIRE: envVars.JWT_EXPIRE,
  JWT_REFRESH_EXPIRE: envVars.JWT_REFRESH_EXPIRE,
  APP_NAME: envVars.APP_NAME,
  API_VERSION: envVars.API_VERSION,
  RATE_LIMIT_WINDOW_MS: envVars.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS: envVars.RATE_LIMIT_MAX_REQUESTS,
  SOCKET_PING_TIMEOUT: envVars.SOCKET_PING_TIMEOUT,
  SOCKET_PING_INTERVAL: envVars.SOCKET_PING_INTERVAL,
  MONGODB_MAX_POOL_SIZE: envVars.MONGODB_MAX_POOL_SIZE,
  MONGODB_MIN_POOL_SIZE: envVars.MONGODB_MIN_POOL_SIZE,
};

export default config;
