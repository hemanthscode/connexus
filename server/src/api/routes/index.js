import express from 'express';
import authRoutes from './auth.js';
import chatRoutes from './chat.js';
import userRoutes from './users.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);
router.use('/users', userRoutes);

export default router;
