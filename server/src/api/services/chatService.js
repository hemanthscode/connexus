import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { findUserActiveConversations, findConversationMessages } from '../utils/dbHelpers.js';
import { ERROR_MESSAGES } from '../constants/index.js';

/**
 * Get all active conversations for a user (excluding archived),
 * with unread counts.
 */
export const getUserConversations = async (userId) => {
  const conversations = await findUserActiveConversations(Conversation, userId);

  return Promise.all(
    conversations.map(async (conv) => {
      const participant = conv.getParticipant(userId);
      if (!participant) return { ...conv.toObject(), unreadCount: 0 };

      const unreadCount = await Message.countDocuments({
        conversation: conv._id,
        createdAt: { $gt: participant.lastRead },
        sender: { $ne: userId },
        isDeleted: false,
      });

      return { ...conv.toObject(), unreadCount };
    })
  );
};

/**
 * Get messages for a conversation with pagination.
 */
export const getConversationMessages = async (conversationId, userId, { page = 1, limit = 50 }) => {
  const convo = await Conversation.findById(conversationId);
  if (!convo || !convo.hasParticipant(userId) || convo.settings.archived) {
    const error = new Error(ERROR_MESSAGES.UNAUTHORIZED_ARCHIVED);
    error.statusCode = 403;
    throw error;
  }

  const messages = await findConversationMessages(Message, conversationId, page, limit);
  return messages.reverse();
};

/**
 * Send a message in a conversation.
 * Validates participant membership and blocked users.
 */
export const sendMessage = async (conversationId, userId, content, type = 'text', replyTo = null, attachments = []) => {
  const convo = await Conversation.findById(conversationId);
  if (!convo || !convo.hasParticipant(userId) || convo.settings.archived) {
    const error = new Error(ERROR_MESSAGES.UNAUTHORIZED_ARCHIVED);
    error.statusCode = 403;
    throw error;
  }

  if (convo.type === 'direct') {
    const otherParticipantId = convo.participants.find(p => p.user.toString() !== userId.toString())?.user;
    if (otherParticipantId) {
      const otherUser = await User.findById(otherParticipantId);
      if (otherUser.blockedUsers.includes(userId)) {
        const error = new Error(ERROR_MESSAGES.BLOCKED_BY_RECIPIENT);
        error.statusCode = 403;
        throw error;
      }
    }
  }

  const message = new Message({
    content,
    sender: userId,
    conversation: conversationId,
    type,
    replyTo,
    attachments,
  });
  await message.save();
  await message.populate('sender', 'name email avatar');

  await convo.updateLastMessage(content, userId);
  return message;
};

/**
 * Edit message content (only sender can edit within time limit).
 */
export const editMessage = async (messageId, userId, newContent) => {
  const message = await Message.findById(messageId);
  if (!message) throw new Error(ERROR_MESSAGES.MESSAGE_NOT_FOUND);
  if (message.sender.toString() !== userId.toString()) {
    const error = new Error(ERROR_MESSAGES.UNAUTHORIZED_EDIT);
    error.statusCode = 403;
    throw error;
  }
  const updatedMessage = await message.editContent(newContent);
  return updatedMessage;
};

/**
 * Soft delete message (only sender or admins in group).
 */
export const softDeleteMessage = async (messageId, userId) => {
  const message = await Message.findById(messageId);
  if (!message) throw new Error(ERROR_MESSAGES.MESSAGE_NOT_FOUND);
  const convo = await Conversation.findById(message.conversation);

  if (!convo) throw new Error(ERROR_MESSAGES.CONVERSATION_NOT_FOUND);

  const isSender = message.sender.toString() === userId.toString();
  const participant = convo.getParticipant(userId);
  const isAdmin = participant?.role === 'admin';

  if (!isSender && !isAdmin) {
    const error = new Error(ERROR_MESSAGES.UNAUTHORIZED_DELETE);
    error.statusCode = 403;
    throw error;
  }

  return message.softDelete();
};

/**
 * Add reaction emoji to a message.
 */
export const addReactionToMessage = async (messageId, userId, emoji) => {
  const message = await Message.findById(messageId);
  if (!message) throw new Error(ERROR_MESSAGES.MESSAGE_NOT_FOUND);
  
  await message.addReaction(userId, emoji);
  await message.populate('reactions.user', 'name email avatar');
  return message;
};

/**
 * Remove reaction emoji from a message.
 */
export const removeReactionFromMessage = async (messageId, userId, emoji) => {
  const message = await Message.findById(messageId);
  if (!message) throw new Error(ERROR_MESSAGES.MESSAGE_NOT_FOUND);
  
  await message.removeReaction(userId, emoji);
  await message.populate('reactions.user', 'name email avatar');
  return message;
};

/**
 * Mark conversation as read by user.
 */
export const markConversationAsRead = async (conversationId, userId) => {
  const convo = await Conversation.findById(conversationId);
  if (!convo || !convo.hasParticipant(userId)) {
    const error = new Error(ERROR_MESSAGES.UNAUTHORIZED);
    error.statusCode = 403;
    throw error;
  }

  const participant = convo.getParticipant(userId);
  if (participant) {
    participant.lastRead = new Date();
    await convo.save();
  }

  const unread = await Message.find({
    conversation: convo._id,
    sender: { $ne: new mongoose.Types.ObjectId(userId) },
    isDeleted: false,
  });

  await Promise.all(unread.map((msg) => msg.markAsRead(userId)));
};

/**
 * Create or get a direct conversation between two users.
 */
export const createOrGetDirectConversation = async (userId, participantId) => {
  if (userId.toString() === participantId.toString()) {
    const error = new Error('Cannot create direct conversation with yourself');
    error.statusCode = 400;
    throw error;
  }

  const participant = await User.findById(participantId).select('_id name email avatar isActive');
  if (!participant || !participant.isActive) {
    const error = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }

  // Find existing direct conversation
  const existing = await Conversation.findOne({
    type: 'direct',
    isActive: true,
    $and: [
      { 'participants.user': userId },
      { 'participants.user': participantId }
    ]
  }).populate('participants.user', 'name email avatar status lastSeen');

  if (existing) return existing;

  // Create new direct conversation
  const convo = new Conversation({
    type: 'direct',
    participants: [
      { user: userId, role: 'member', joinedAt: new Date() }, 
      { user: participantId, role: 'member', joinedAt: new Date() }
    ],
    createdBy: userId,
    isActive: true,
    settings: {
      allowNewMembers: false,
      muteNotifications: false,
      archived: false
    }
  });
  
  await convo.save();
  await convo.populate('participants.user', 'name email avatar status lastSeen');
  return convo;
};

/**
 * Create group conversation
 */
export const createGroupConversation = async (creatorId, name, description, participants = [], avatar = null) => {
  if (!name || name.trim().length === 0) throw new Error(ERROR_MESSAGES.GROUP_NAME_REQUIRED);

  const participantList = [{ user: creatorId, role: 'admin' }];
  for (const userId of participants) {
    if (userId.toString() !== creatorId.toString()) {
      participantList.push({ user: userId, role: 'member' });
    }
  }

  const group = new Conversation({
    type: 'group',
    name: name.trim(),
    description: description?.trim() || '',
    participants: participantList,
    createdBy: creatorId,
    avatar,
  });

  await group.save();
  await group.populate('participants.user', 'name email avatar');
  return group;
};

/**
 * Update group info: name, description, avatar
 */
export const updateGroupInfo = async (conversationId, userId, updateFields) => {
  const convo = await Conversation.findById(conversationId);
  if (!convo || convo.type !== 'group') throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);

  const participant = convo.getParticipant(userId);
  if (!participant || !['admin', 'moderator'].includes(participant.role)) {
    const error = new Error(ERROR_MESSAGES.NOT_AUTHORIZED_UPDATE);
    error.statusCode = 403;
    throw error;
  }

  if (updateFields.name) convo.name = updateFields.name.trim();
  if (updateFields.description) convo.description = updateFields.description.trim();
  if (updateFields.avatar !== undefined) convo.avatar = updateFields.avatar;

  await convo.save();
  return convo;
};

/**
 * Add participant(s) to group
 */
export const addParticipantsToGroup = async (conversationId, userId, newUserIds = []) => {
  const convo = await Conversation.findById(conversationId);
  if (!convo || convo.type !== 'group') throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);

  const participant = convo.getParticipant(userId);
  if (!participant || !['admin', 'moderator'].includes(participant.role)) {
    const error = new Error(ERROR_MESSAGES.NOT_AUTHORIZED_ADD);
    error.statusCode = 403;
    throw error;
  }

  for (const newUserId of newUserIds) {
    if (!convo.hasParticipant(newUserId)) {
      convo.participants.push({ user: newUserId, role: 'member', joinedAt: new Date() });
    }
  }

  await convo.save();
  return convo;
};

/**
 * Remove participant from group
 */
export const removeParticipantFromGroup = async (conversationId, removerId, removeeId) => {
  const convo = await Conversation.findById(conversationId);
  if (!convo || convo.type !== 'group') throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);

  const remover = convo.getParticipant(removerId);
  if (!remover) {
    const error = new Error(ERROR_MESSAGES.UNAUTHORIZED);
    error.statusCode = 403;
    throw error;
  }

  if (removerId.toString() !== removeeId.toString() && !['admin', 'moderator'].includes(remover.role)) {
    const error = new Error(ERROR_MESSAGES.NOT_AUTHORIZED_REMOVE);
    error.statusCode = 403;
    throw error;
  }

  await convo.removeParticipant(removeeId);
  return convo;
};

/**
 * Change participant role
 */
export const changeParticipantRole = async (conversationId, adminId, participantId, newRole) => {
  const convo = await Conversation.findById(conversationId);
  if (!convo || convo.type !== 'group') throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);

  const admin = convo.getParticipant(adminId);
  if (!admin || admin.role !== 'admin') {
    const error = new Error(ERROR_MESSAGES.ONLY_ADMIN_CHANGE_ROLES);
    error.statusCode = 403;
    throw error;
  }

  await convo.changeParticipantRole(participantId, newRole);
  return convo;
};

/**
 * Archive or unarchive a conversation
 */
export const setConversationArchivedStatus = async (conversationId, userId, archived) => {
  const convo = await Conversation.findById(conversationId);
  if (!convo) throw new Error(ERROR_MESSAGES.CONVERSATION_NOT_FOUND);
  const participant = convo.getParticipant(userId);
  if (!participant) {
    const error = new Error(ERROR_MESSAGES.UNAUTHORIZED);
    error.statusCode = 403;
    throw error;
  }

  convo.settings.archived = archived;
  await convo.save();
  return convo;
};

// REMOVED: searchActiveUsers function (moved to userService.js to avoid duplication)

export default {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  editMessage,
  softDeleteMessage,
  addReactionToMessage,
  removeReactionFromMessage,
  markConversationAsRead,
  createOrGetDirectConversation,
  createGroupConversation,
  updateGroupInfo,
  addParticipantsToGroup,
  removeParticipantFromGroup,
  changeParticipantRole,
  setConversationArchivedStatus,
};
