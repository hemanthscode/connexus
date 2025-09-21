import jwt from 'jsonwebtoken'
import { config } from '../../config/index.js'
import User from '../../core/models/User.js'

export const protect = async (req, res, next) => {
  try {
    let token
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' })
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET)
      const user = await User.findById(decoded.userId).select('-password')
      if (!user || !user.isActive) {
        return res.status(401).json({ success: false, message: 'Unauthorized' })
      }

      req.user = user
      next()
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid token' })
    }
  } catch (error) {
    console.error(
      JSON.stringify({ message: error.message, stack: error.stack, path: req.path, method: req.method })
    )
    res.status(500).json({ success: false, message: 'Authentication failure' })
  }
}

export default { protect }
