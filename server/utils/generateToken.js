import jwt from 'jsonwebtoken'
import { config } from '../config.js'

/**
 * Generate JWT token for user
 */
export const generateToken = (userId) => {
  return jwt.sign(
    { userId: userId.toString() }, 
    config.JWT_SECRET, 
    {
      expiresIn: config.JWT_EXPIRE,
      issuer: config.APP_NAME,
      audience: 'connexus-users'
    }
  )
}

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET)
  } catch (error) {
    throw new Error('Invalid token')
  }
}

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token) => {
  return jwt.decode(token, { complete: true })
}

/**
 * Generate token response object with real user data
 */
export const generateTokenResponse = (user) => {
  const token = generateToken(user._id)
  
  return {
    token,
    user: user.getPublicProfile(),
    expiresIn: config.JWT_EXPIRE
  }
}

export default {
  generateToken,
  verifyToken,
  decodeToken,
  generateTokenResponse
}
