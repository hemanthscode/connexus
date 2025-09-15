// connexus-server/utils/generateToken.js
import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export const generateToken = (userId) =>
  jwt.sign({ userId: userId.toString() }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE,
    issuer: config.APP_NAME,
    audience: 'connexus-users',
  })

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET)
  } catch {
    throw new Error('Invalid token')
  }
}

export const generateTokenResponse = (user) => {
  const token = generateToken(user._id)
  return {
    token,
    user: user.getPublicProfile(),
    expiresIn: config.JWT_EXPIRE,
  }
}

export default { generateToken, verifyToken, generateTokenResponse }
