import express from 'express'
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  createDirectConversation,
  searchUsers
} from '../controllers/chatController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Apply authentication middleware to all chat routes
router.use(protect)

// Conversation routes
router.get('/conversations', getConversations)
router.post('/conversations/direct', createDirectConversation)
router.get('/conversations/:id/messages', getMessages)
router.put('/conversations/:id/read', markAsRead)

// Message routes
router.post('/messages', sendMessage)

// User search routes
router.get('/users/search', searchUsers)

// Test route (keep for testing)
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Chat routes working',
    user: req.user.name,
    timestamp: new Date().toISOString()
  })
})

export default router
