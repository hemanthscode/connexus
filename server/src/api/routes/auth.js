import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', authLimiter, login);

router.get('/me', protect, authLimiter, getMe);
router.put('/me', protect, updateProfile);
router.put('/password', protect, changePassword);
router.post('/logout', protect, logout);

export default router;
