import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import User from '../models/User.js'

/**
 * Protect routes - require authentication
 */
export const protect = async (req, res, next) => {
  try {
    let token
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - no token provided'
      })
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, config.JWT_SECRET)
      
      // Get user from database
      const user = await User.findById(decoded.userId).select('-password')
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized - user not found'
        })
      }
      
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        })
      }
      
      // Add user to request object
      req.user = user
      next()
      
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - invalid token'
      })
    }
    
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    })
  }
}

/**
 * Optional auth - add user to req if token exists
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
      
      try {
        const decoded = jwt.verify(token, config.JWT_SECRET)
        const user = await User.findById(decoded.userId).select('-password')
        
        if (user && user.isActive) {
          req.user = user
        }
      } catch (error) {
        // Token invalid, but continue without user
      }
    }
    
    next()
  } catch (error) {
    next()
  }
}

/**
 * Authorize specific roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      })
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'User role is not authorized to access this route'
      })
    }
    
    next()
  }
}

export default {
  protect,
  optionalAuth,
  authorize
}
