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
  setConversationArchivedStatus,
} from '../services/chatService.js';
import { searchUsers as searchUsersService } from '../services/userService.js'; // FIXED: Renamed to avoid collision
import { validateSendMessage, validateEditMessage } from '../validations/chatValidation.js';
import { sendSuccess, sendError, sendValidationError, sendServiceError } from '../utils/responseHelper.js';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, STATUS_CODES } from '../constants/index.js';
import { formatReactions } from '../utils/dbHelpers.js';

/**
 * Get conversations for the authenticated user
 */
export const getConversations = async (req, res) => {
  try {
    const conversations = await getUserConversations(req.user._id);
    sendSuccess(res, 'Conversations retrieved', conversations);
  } catch (error) {
    sendServiceError(res, error, ERROR_MESSAGES.FETCHING_CONVERSATIONS_FAILED);
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
    sendSuccess(res, 'Messages retrieved', messages);
  } catch (error) {
    if (error.statusCode === STATUS_CODES.FORBIDDEN) {
      return sendError(res, ERROR_MESSAGES.UNAUTHORIZED_ARCHIVED, STATUS_CODES.FORBIDDEN);
    }
    sendServiceError(res, error, ERROR_MESSAGES.FETCHING_MESSAGES_FAILED);
  }
};

/**
 * Send message to a conversation
 */
export const sendMessageController = async (req, res) => {
  try {
    const { error } = validateSendMessage(req.body);
    if (error) return sendValidationError(res, error);

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

    sendSuccess(res, SUCCESS_MESSAGES.MESSAGE_SENT, message, STATUS_CODES.CREATED);
  } catch (error) {
    if (error.statusCode === STATUS_CODES.FORBIDDEN) {
      return sendError(res, error.message, STATUS_CODES.FORBIDDEN);
    }
    sendServiceError(res, error, ERROR_MESSAGES.SENDING_MESSAGE_FAILED);
  }
};

/**
 * Edit a message
 */
export const editMessageController = async (req, res) => {
  try {
    const { error } = validateEditMessage(req.body);
    if (error) return sendValidationError(res, error);

    const { messageId, newContent } = req.body;
    const updatedMessage = await editMessage(messageId, req.user._id, newContent.trim());
    sendSuccess(res, 'Message updated', updatedMessage);
  } catch (error) {
    if (error.statusCode === STATUS_CODES.FORBIDDEN) {
      return sendError(res, ERROR_MESSAGES.UNAUTHORIZED_EDIT, STATUS_CODES.FORBIDDEN);
    }
    sendServiceError(res, error, ERROR_MESSAGES.EDITING_MESSAGE_FAILED);
  }
};

/**
 * Soft delete a message
 */
export const deleteMessageController = async (req, res) => {
  try {
    const { messageId } = req.params;
    await softDeleteMessage(messageId, req.user._id);
    sendSuccess(res, SUCCESS_MESSAGES.MESSAGE_DELETED);
  } catch (error) {
    if (error.statusCode === STATUS_CODES.FORBIDDEN) {
      return sendError(res, ERROR_MESSAGES.UNAUTHORIZED_DELETE, STATUS_CODES.FORBIDDEN);
    }
    sendServiceError(res, error, ERROR_MESSAGES.DELETING_MESSAGE_FAILED);
  }
};

/**
 * Add reaction to a message
 */
export const addReactionController = async (req, res) => {
  try {
    const { messageId, emoji } = req.body;
    
    if (!messageId || !emoji) {
      return sendError(res, 'messageId and emoji are required', STATUS_CODES.BAD_REQUEST);
    }

    const message = await addReactionToMessage(messageId, req.user._id, emoji);
    const formattedReactions = formatReactions(message.reactions);
    
    sendSuccess(res, 'Reaction added', {
      messageId: message._id,
      reactions: formattedReactions
    });
  } catch (error) {
    sendServiceError(res, error, ERROR_MESSAGES.ADDING_REACTION_FAILED);
  }
};

/**
 * Remove reaction from a message  
 */
export const removeReactionController = async (req, res) => {
  try {
    const { messageId, emoji } = req.body;
    
    if (!messageId || !emoji) {
      return sendError(res, 'messageId and emoji are required', STATUS_CODES.BAD_REQUEST);
    }

    const message = await removeReactionFromMessage(messageId, req.user._id, emoji);
    const formattedReactions = formatReactions(message.reactions);
    
    sendSuccess(res, 'Reaction removed', {
      messageId: message._id,
      reactions: formattedReactions
    });
  } catch (error) {
    sendServiceError(res, error, ERROR_MESSAGES.REMOVING_REACTION_FAILED);
  }
};

/**
 * Mark a conversation as read
 */
export const markAsRead = async (req, res) => {
  try {
    await markConversationAsRead(req.params.id, req.user._id);
    sendSuccess(res, SUCCESS_MESSAGES.MARKED_AS_READ);
  } catch (error) {
    if (error.statusCode === STATUS_CODES.FORBIDDEN) {
      return sendError(res, ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.FORBIDDEN);
    }
    sendServiceError(res, error, ERROR_MESSAGES.MARK_READ_FAILED);
  }
};

/**
 * Create or get direct conversation
 */
export const createDirectConversation = async (req, res) => {
  try {
    const convo = await createOrGetDirectConversation(req.user._id, req.body.participantId);
    sendSuccess(res, 'Conversation ready', convo, STATUS_CODES.CREATED);
  } catch (error) {
    sendServiceError(res, error, ERROR_MESSAGES.CREATION_FAILED);
  }
};

/**
 * Create a group conversation
 */
export const createGroup = async (req, res) => {
  try {
    const { name, description, participants = [], avatar = null } = req.body;
    const group = await createGroupConversation(req.user._id, name, description, participants, avatar);
    sendSuccess(res, 'Group created', group, STATUS_CODES.CREATED);
  } catch (error) {
    sendServiceError(res, error, ERROR_MESSAGES.GROUP_CREATION_FAILED);
  }
};

/**
 * Update group info
 */
export const updateGroup = async (req, res) => {
  try {
    const { name, description, avatar } = req.body;
    const updatedGroup = await updateGroupInfo(req.params.id, req.user._id, { name, description, avatar });
    sendSuccess(res, 'Group updated', updatedGroup);
  } catch (error) {
    sendServiceError(res, error, ERROR_MESSAGES.GROUP_UPDATE_FAILED);
  }
};

/**
 * Add participants to group
 */
export const addGroupParticipants = async (req, res) => {
  try {
    const { participants } = req.body;
    if (!Array.isArray(participants) || participants.length === 0) {
      return sendError(res, 'Participants array required', STATUS_CODES.BAD_REQUEST);
    }
    const updatedGroup = await addParticipantsToGroup(req.params.id, req.user._id, participants);
    sendSuccess(res, 'Participants added', updatedGroup);
  } catch (error) {
    sendServiceError(res, error, ERROR_MESSAGES.ADDING_PARTICIPANTS_FAILED);
  }
};

/**
 * Remove participant from group
 */
export const removeGroupParticipant = async (req, res) => {
  try {
    const { participantId } = req.params;
    const updatedGroup = await removeParticipantFromGroup(req.params.id, req.user._id, participantId);
    sendSuccess(res, 'Participant removed', updatedGroup);
  } catch (error) {
    sendServiceError(res, error, ERROR_MESSAGES.REMOVING_PARTICIPANT_FAILED);
  }
};

/**
 * Change participant role
 */
export const changeRole = async (req, res) => {
  try {
    const { participantId, role } = req.body;
    if (!participantId || !role) {
      return sendError(res, 'participantId and role required', STATUS_CODES.BAD_REQUEST);
    }
    const updatedGroup = await changeParticipantRole(req.params.id, req.user._id, participantId, role);
    sendSuccess(res, 'Role updated', updatedGroup);
  } catch (error) {
    sendServiceError(res, error, ERROR_MESSAGES.CHANGING_ROLE_FAILED);
  }
};

/**
 * Archive or unarchive conversation
 */
export const archiveConversation = async (req, res) => {
  try {
    const { archived } = req.body;
    if (typeof archived !== 'boolean') {
      return sendError(res, 'archived must be boolean', STATUS_CODES.BAD_REQUEST);
    }
    const convo = await setConversationArchivedStatus(req.params.id, req.user._id, archived);
    sendSuccess(res, 'Archive status updated', convo);
  } catch (error) {
    sendServiceError(res, error, ERROR_MESSAGES.ARCHIVING_FAILED);
  }
};

/**
 * Search active users
 */
export const searchUsers = async (req, res) => {
  try {
    const users = await searchUsersService(req.query.q, req.user._id, 10); // FIXED: Using renamed import
    sendSuccess(res, 'Users found', users);
  } catch (error) {
    if (error.statusCode === STATUS_CODES.BAD_REQUEST) {
      return sendError(res, ERROR_MESSAGES.QUERY_TOO_SHORT, STATUS_CODES.BAD_REQUEST);
    }
    sendServiceError(res, error, ERROR_MESSAGES.SEARCH_FAILED);
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
