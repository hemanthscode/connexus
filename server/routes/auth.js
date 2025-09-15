// connexus-server/routes/auth.js
import express from 'express'
import { register, login, getMe, updateProfile, changePassword, logout } from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', protect, getMe)
router.put('/me', protect, updateProfile)
router.put('/password', protect, changePassword)
router.post('/logout', protect, logout)

export default router
