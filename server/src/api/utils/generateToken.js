import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

/**
 * Generate JWT token signed with userId and app settings.
 */
export const generateToken = (userId) =>
  jwt.sign({ userId: userId.toString() }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE,
    issuer: config.APP_NAME,
    audience: 'connexus-users',
  });

/**
 * Verify provided JWT token.
 * Throws error if invalid.
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch {
    throw new Error('Invalid token');
  }
};

/**
 * Generate token response object with token, user profile, and expiration.
 */
export const generateTokenResponse = (user) => {
  const token = generateToken(user._id);
  return {
    token,
    user: user.getPublicProfile(),
    expiresIn: config.JWT_EXPIRE,
  };
};

export default {
  generateToken,
  verifyToken,
  generateTokenResponse,
};
