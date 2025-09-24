import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,
  message: { error: 'Too many auth requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1500,
  message: { error: 'Too many requests in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  authLimiter,
  generalLimiter,
};
