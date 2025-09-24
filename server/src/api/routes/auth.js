import express from 'express';
import {
  register,
  login,
  changePassword,
  logout,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', authLimiter, login);

// Protected auth routes
router.put('/password', protect, changePassword);
router.post('/logout', protect, logout);

export default router;
