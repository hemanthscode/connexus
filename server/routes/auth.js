import express from 'express'
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
} from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Public routes
router.post('/register', register)
router.post('/login', login)

// Protected routes
router.get('/me', protect, getMe)
router.put('/me', protect, updateProfile)
router.put('/password', protect, changePassword)
router.post('/logout', protect, logout)

// Test route (keep for testing)
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth routes working',
    timestamp: new Date().toISOString()
  })
})

export default router
