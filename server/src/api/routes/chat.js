import express from 'express';
import {
  getConversations,
  getMessages,
  sendMessageController,
  markAsRead,
  createDirectConversation,
  createGroup,
  updateGroup,
  addGroupParticipants,
  removeGroupParticipant,
  changeRole,
  editMessageController,
  deleteMessageController,
  addReactionController,
  removeReactionController,
  searchUsers,
  archiveConversation,
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Conversation endpoints
router.get('/conversations', getConversations);
router.post('/conversations/direct', createDirectConversation);
router.post('/conversations/group', createGroup);
router.put('/conversations/:id', updateGroup);
router.post('/conversations/:id/participants', addGroupParticipants);
router.delete('/conversations/:id/participants/:participantId', removeGroupParticipant);
router.put('/conversations/:id/participants/role', changeRole);
router.put('/conversations/:id/archive', archiveConversation);

// Messages endpoints
router.get('/conversations/:id/messages', getMessages);
router.post('/messages', sendMessageController);
router.put('/messages/edit', editMessageController);
router.delete('/messages/:messageId', deleteMessageController);
router.put('/conversations/:id/read', markAsRead);

// Reactions
router.post('/messages/reactions', addReactionController);
router.post('/messages/reactions/remove', removeReactionController);

// User search
router.get('/users/search', searchUsers);

export default router;
