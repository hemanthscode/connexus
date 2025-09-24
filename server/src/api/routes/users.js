import express from 'express';
import { 
  getMe, 
  getProfile, 
  updateProfile, 
  searchUsersController 
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(protect);

// User profile routes
router.get('/me', authLimiter, getMe);
router.put('/me', updateProfile);
router.get('/search', searchUsersController);
router.get('/:userId', getProfile);

export default router;
