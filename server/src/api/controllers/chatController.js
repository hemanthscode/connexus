import {
  getUserConversations,
  getConversationMessages,
  sendMessageInConversation,
  markConversationAsRead,
  createOrGetDirectConversation,
  searchActiveUsers,
} from '../../core/services/chatService.js';

/**
 * Get conversations for authenticated user
 */
export const getConversations = async (req, res) => {
  try {
    const conversations = await getUserConversations(req.user._id);
    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Fetching conversations failed' });
  }
};

/**
 * Get messages for a conversation with pagination
 */
export const getMessages = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 50); // impose max limit 100

    const messages = await getConversationMessages(req.params.id, req.user._id, { page, limit });
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error(error);
    if (error.statusCode === 403) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    res.status(500).json({ success: false, message: 'Fetching messages failed' });
  }
};

/**
 * Send message to a conversation
 * Enhanced to return full message with populated sender and status
 */
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type = 'text' } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message content required' });
    }

    const message = await sendMessageInConversation(conversationId, req.user._id, content.trim(), type);

    // Populate sender info in the returned message for frontend integration
    await message.populate('sender', 'name email avatar');

    res.status(201).json({ success: true, message: 'Message sent', data: message });
  } catch (error) {
    console.error(error);
    if (error.statusCode === 403) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    res.status(500).json({ success: false, message: 'Sending message failed' });
  }
};

/**
 * Mark conversation messages as read
 */
export const markAsRead = async (req, res) => {
  try {
    await markConversationAsRead(req.params.id, req.user._id);
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    console.error(error);
    if (error.statusCode === 403) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    res.status(500).json({ success: false, message: 'Mark as read failed' });
  }
};

/**
 * Create or get existing direct conversation
 */
export const createDirectConversation = async (req, res) => {
  try {
    const convo = await createOrGetDirectConversation(req.user._id, req.body.participantId);
    res.status(201).json({ success: true, data: convo });
  } catch (error) {
    console.error(error);
    if (error.statusCode === 404) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(500).json({ success: false, message: 'Creation failed' });
  }
};

/**
 * Search active users for conversation additions
 */
export const searchUsers = async (req, res) => {
  try {
    const users = await searchActiveUsers(req.query.q, req.user._id);
    res.json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: 'Query too short' });
    }
    res.status(500).json({ success: false, message: 'Search failed' });
  }
};

export default {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  createDirectConversation,
  searchUsers,
};
