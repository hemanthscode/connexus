import express from 'express';
import authRoutes from './auth.js';
import chatRoutes from './chat.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);

export default router;
