import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // max 300 requests per IP per minute on auth routes
  message: { error: 'Too many auth requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1500, // max 1500 requests per minute for general usage
  message: { error: 'Too many requests in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});
