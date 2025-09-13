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

router.use(protect)

router.get('/conversations', getConversations)
router.post('/conversations/direct', createDirectConversation)
router.get('/conversations/:id/messages', getMessages)
router.put('/conversations/:id/read', markAsRead)
router.post('/messages', sendMessage)
router.get('/users/search', searchUsers)

export default router
