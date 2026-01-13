import dotenv from 'dotenv';
import Joi from 'joi';

// Load env if present (optional)
dotenv.config();

/**
 * Hardcoded defaults for evaluation / mentor review
 * Used only when process.env values are missing
 */
const DEFAULTS = {
  MONGODB_URI:
    'mongodb+srv://hemanths7dev:antdev%4007@quantum.a3za7.mongodb.net/connexus',
  JWT_SECRET:
    'your_super_secure_jwt_secret_key_at_least_32_chars_long_change_this_in_production',
  PORT: 5000,
  NODE_ENV: 'development',
  CLIENT_URL: 'http://localhost:3000',
  JWT_EXPIRE: '7d',
  JWT_REFRESH_EXPIRE: '30d',
  APP_NAME: 'Connexus',
  API_VERSION: 'v1',
  RATE_LIMIT_WINDOW_MS: 60000,
  RATE_LIMIT_MAX_REQUESTS: 1000,
  SOCKET_PING_TIMEOUT: 60000,
  SOCKET_PING_INTERVAL: 25000,
  MONGODB_MAX_POOL_SIZE: 100,
  MONGODB_MIN_POOL_SIZE: 5,
};

const envSchema = Joi.object({
  JWT_SECRET: Joi.string().min(32).required(),
  MONGODB_URI: Joi.string().uri().required(),
  PORT: Joi.number().default(DEFAULTS.PORT),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default(DEFAULTS.NODE_ENV),
  CLIENT_URL: Joi.string().uri().default(DEFAULTS.CLIENT_URL),
  JWT_EXPIRE: Joi.string().default(DEFAULTS.JWT_EXPIRE),
  JWT_REFRESH_EXPIRE: Joi.string().default(DEFAULTS.JWT_REFRESH_EXPIRE),
  APP_NAME: Joi.string().default(DEFAULTS.APP_NAME),
  API_VERSION: Joi.string().default(DEFAULTS.API_VERSION),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(DEFAULTS.RATE_LIMIT_WINDOW_MS),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(DEFAULTS.RATE_LIMIT_MAX_REQUESTS),
  SOCKET_PING_TIMEOUT: Joi.number().default(DEFAULTS.SOCKET_PING_TIMEOUT),
  SOCKET_PING_INTERVAL: Joi.number().default(DEFAULTS.SOCKET_PING_INTERVAL),
  MONGODB_MAX_POOL_SIZE: Joi.number().default(DEFAULTS.MONGODB_MAX_POOL_SIZE),
  MONGODB_MIN_POOL_SIZE: Joi.number().default(DEFAULTS.MONGODB_MIN_POOL_SIZE),
}).unknown();

// Merge env + defaults (env takes priority)
const mergedEnv = {
  ...DEFAULTS,
  ...process.env,
};

const { error, value: envVars } = envSchema.validate(mergedEnv, {
  abortEarly: false,
});

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
