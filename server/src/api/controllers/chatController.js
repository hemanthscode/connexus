import {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markConversationAsRead,
  createOrGetDirectConversation,
  createGroupConversation,
  updateGroupInfo,
  addParticipantsToGroup,
  removeParticipantFromGroup,
  changeParticipantRole,
  editMessage,
  softDeleteMessage,
  addReactionToMessage,
  removeReactionFromMessage,
  searchActiveUsers,
  setConversationArchivedStatus,
} from '../services/chatService.js';
import { validateSendMessage, validateEditMessage } from '../validations/chatValidation.js';

/**
 * Get conversations for the authenticated user
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
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);

    const messages = await getConversationMessages(req.params.id, req.user._id, { page, limit });
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error(error);
    if (error.statusCode === 403) {
      return res.status(403).json({ success: false, message: 'Unauthorized or conversation archived' });
    }
    res.status(500).json({ success: false, message: 'Fetching messages failed' });
  }
};

/**
 * Send message to a conversation
 */
export const sendMessageController = async (req, res) => {
  try {
    const { error } = validateSendMessage(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { conversationId, content, type = 'text', replyTo = null, attachments = [] } = req.body;

    const message = await sendMessage(
      conversationId,
      req.user._id,
      content.trim(),
      type,
      replyTo,
      attachments
    );
    await message.populate('sender', 'name email avatar');

    res.status(201).json({ success: true, message: 'Message sent', data: message });
  } catch (error) {
    console.error(error);
    if (error.statusCode === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Sending message failed' });
  }
};

/**
 * Edit a message
 */
export const editMessageController = async (req, res) => {
  try {
    const { error } = validateEditMessage(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { messageId, newContent } = req.body;
    const updatedMessage = await editMessage(messageId, req.user._id, newContent.trim());
    res.json({ success: true, data: updatedMessage });
  } catch (error) {
    console.error(error);
    if (error.statusCode === 403) {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit message' });
    }
    res.status(500).json({ success: false, message: 'Editing message failed' });
  }
};

/**
 * Soft delete a message
 */
export const deleteMessageController = async (req, res) => {
  try {
    const { messageId } = req.params;
    await softDeleteMessage(messageId, req.user._id);
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error(error);
    if (error.statusCode === 403) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete message' });
    }
    res.status(500).json({ success: false, message: 'Deleting message failed' });
  }
};

/**
 * Add reaction to a message
 * FIXED: Return properly formatted reaction data with user details
 */
export const addReactionController = async (req, res) => {
  try {
    const { messageId, emoji } = req.body;
    
    if (!messageId || !emoji) {
      return res.status(400).json({ success: false, message: 'messageId and emoji are required' });
    }

    const message = await addReactionToMessage(messageId, req.user._id, emoji);
    
    // FIXED: Format reactions with complete user details for frontend
    const formattedReactions = message.reactions.map(reaction => ({
      emoji: reaction.emoji,
      user: reaction.user._id,
      userDetails: {
        _id: reaction.user._id,
        name: reaction.user.name,
        email: reaction.user.email,
        avatar: reaction.user.avatar
      },
      reactedAt: reaction.timestamp
    }));
    
    res.json({ 
      success: true, 
      data: {
        messageId: message._id,
        reactions: formattedReactions
      }
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ success: false, message: 'Adding reaction failed' });
  }
};

/**
 * Remove reaction from a message  
 * FIXED: Return properly formatted reaction data with user details
 */
export const removeReactionController = async (req, res) => {
  try {
    const { messageId, emoji } = req.body;
    
    if (!messageId || !emoji) {
      return res.status(400).json({ success: false, message: 'messageId and emoji are required' });
    }

    const message = await removeReactionFromMessage(messageId, req.user._id, emoji);
    
    // FIXED: Format reactions with complete user details for frontend  
    const formattedReactions = message.reactions.map(reaction => ({
      emoji: reaction.emoji,
      user: reaction.user._id,
      userDetails: {
        _id: reaction.user._id,
        name: reaction.user.name,
        email: reaction.user.email,
        avatar: reaction.user.avatar
      },
      reactedAt: reaction.timestamp
    }));
    
    res.json({ 
      success: true, 
      data: {
        messageId: message._id,
        reactions: formattedReactions
      }
    });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({ success: false, message: 'Removing reaction failed' });
  }
};

/**
 * Mark a conversation as read
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
 * Create or get direct conversation
 */
export const createDirectConversation = async (req, res) => {
  try {
    const convo = await createOrGetDirectConversation(req.user._id, req.body.participantId);
    res.status(201).json({ success: true, data: convo });
  } catch (error) {
    console.error(error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message || 'Creation failed' });
  }
};

/**
 * Create a group conversation
 */
export const createGroup = async (req, res) => {
  try {
    const { name, description, participants = [], avatar = null } = req.body;
    const group = await createGroupConversation(req.user._id, name, description, participants, avatar);
    res.status(201).json({ success: true, data: group });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Group creation failed' });
  }
};

/**
 * Update group info
 */
export const updateGroup = async (req, res) => {
  try {
    const { name, description, avatar } = req.body;
    const updatedGroup = await updateGroupInfo(req.params.id, req.user._id, { name, description, avatar });
    res.json({ success: true, data: updatedGroup });
  } catch (error) {
    console.error(error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message || 'Group update failed' });
  }
};

/**
 * Add participants to group
 */
export const addGroupParticipants = async (req, res) => {
  try {
    const { participants } = req.body;
    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ success: false, message: 'Participants array required' });
    }
    const updatedGroup = await addParticipantsToGroup(req.params.id, req.user._id, participants);
    res.json({ success: true, data: updatedGroup });
  } catch (error) {
    console.error(error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message || 'Adding participants failed' });
  }
};

/**
 * Remove participant from group
 */
export const removeGroupParticipant = async (req, res) => {
  try {
    const { participantId } = req.params;
    const updatedGroup = await removeParticipantFromGroup(req.params.id, req.user._id, participantId);
    res.json({ success: true, data: updatedGroup });
  } catch (error) {
    console.error(error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message || 'Removing participant failed' });
  }
};

/**
 * Change participant role
 */
export const changeRole = async (req, res) => {
  try {
    const { participantId, role } = req.body;
    if (!participantId || !role) {
      return res.status(400).json({ success: false, message: 'participantId and role required' });
    }
    const updatedGroup = await changeParticipantRole(req.params.id, req.user._id, participantId, role);
    res.json({ success: true, data: updatedGroup });
  } catch (error) {
    console.error(error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message || 'Changing role failed' });
  }
};

/**
 * Archive or unarchive conversation
 */
export const archiveConversation = async (req, res) => {
  try {
    const { archived } = req.body;
    if (typeof archived !== 'boolean') {
      return res.status(400).json({ success: false, message: 'archived must be boolean' });
    }
    const convo = await setConversationArchivedStatus(req.params.id, req.user._id, archived);
    res.json({ success: true, data: convo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Archiving failed' });
  }
};

/**
 * Search active users
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
  sendMessageController,
  editMessageController,
  deleteMessageController,
  addReactionController,
  removeReactionController,
  markAsRead,
  createDirectConversation,
  createGroup,
  updateGroup,
  addGroupParticipants,
  removeGroupParticipant,
  changeRole,
  archiveConversation,
  searchUsers,
};
