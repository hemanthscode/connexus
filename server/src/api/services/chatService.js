import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

/**
 * Get all active conversations for a user (excluding archived),
 * with unread counts.
 */
export const getUserConversations = async (userId) => {
  const conversations = await Conversation.findUserConversations(userId);

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
 * FIXED: Populate reaction user details
 */
/**
 * Get messages for a conversation with pagination.
 * FIXED: Enhanced population including replyTo.sender
 */
export const getConversationMessages = async (conversationId, userId, { page = 1, limit = 50 }) => {
  const convo = await Conversation.findById(conversationId);
  if (!convo || !convo.hasParticipant(userId) || convo.settings.archived) {
    const error = new Error('Unauthorized or conversation archived');
    error.statusCode = 403;
    throw error;
  }

  // FIXED: Direct query with proper nested population instead of static method
  const skip = (page - 1) * limit;
  
  const messages = await Message.find({ 
    conversation: conversationId,
    isDeleted: false 
  })
    .populate('sender', 'name email avatar')
    .populate({
      path: 'replyTo',
      populate: {
        path: 'sender',
        select: 'name email avatar'
      }
    })
    .populate('reactions.user', 'name email avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return messages.reverse();
};

/**
 * Send a message in a conversation.
 * Validates participant membership and blocked users.
 */
export const sendMessage = async (conversationId, userId, content, type = 'text', replyTo = null, attachments = []) => {
  const convo = await Conversation.findById(conversationId);
  if (!convo || !convo.hasParticipant(userId) || convo.settings.archived) {
    const error = new Error('Unauthorized or conversation archived');
    error.statusCode = 403;
    throw error;
  }

  if (convo.type === 'direct') {
    const otherParticipantId = convo.participants.find(p => p.user.toString() !== userId.toString())?.user;
    if (otherParticipantId) {
      const otherUser = await User.findById(otherParticipantId);
      if (otherUser.blockedUsers.includes(userId)) {
        const error = new Error('You are blocked by the recipient');
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
  if (!message) throw new Error('Message not found');
  if (message.sender.toString() !== userId.toString()) {
    const error = new Error('Unauthorized to edit');
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
  if (!message) throw new Error('Message not found');
  const convo = await Conversation.findById(message.conversation);

  if (!convo) throw new Error('Conversation not found');

  const isSender = message.sender.toString() === userId.toString();
  const participant = convo.getParticipant(userId);
  const isAdmin = participant?.role === 'admin';

  if (!isSender && !isAdmin) {
    const error = new Error('Unauthorized to delete message');
    error.statusCode = 403;
    throw error;
  }

  return message.softDelete();
};

/**
 * Add reaction emoji to a message.
 * FIXED: Return populated message with user details
 */
export const addReactionToMessage = async (messageId, userId, emoji) => {
  const message = await Message.findById(messageId);
  if (!message) throw new Error('Message not found');
  
  await message.addReaction(userId, emoji);
  
  // FIXED: Populate reaction user details before returning
  await message.populate('reactions.user', 'name email avatar');
  return message;
};

/**
 * Remove reaction emoji from a message.
 * FIXED: Return populated message with user details
 */
export const removeReactionFromMessage = async (messageId, userId, emoji) => {
  const message = await Message.findById(messageId);
  if (!message) throw new Error('Message not found');
  
  await message.removeReaction(userId, emoji);
  
  // FIXED: Populate reaction user details before returning
  await message.populate('reactions.user', 'name email avatar');
  return message;
};

/**
 * Mark conversation as read by user.
 */
export const markConversationAsRead = async (conversationId, userId) => {
  const convo = await Conversation.findById(conversationId);
  if (!convo || !convo.hasParticipant(userId)) {
    const error = new Error('Unauthorized');
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
 * Throws 404 if other user not found.
 */
export const createOrGetDirectConversation = async (userId, participantId) => {
  if (userId.toString() === participantId.toString()) {
    const error = new Error('Cannot create direct conversation with yourself');
    error.statusCode = 400;
    throw error;
  }

  const participant = await User.findById(participantId).select('_id name email avatar isActive');
  if (!participant || !participant.isActive) {
    const error = new Error('User not found or inactive');
    error.statusCode = 404;
    throw error;
  }

  // Find existing direct conversation between these two users
  const existing = await Conversation.findOne({
    type: 'direct',
    isActive: true,
    $and: [
      { 'participants.user': userId },
      { 'participants.user': participantId }
    ]
  }).populate('participants.user', 'name email avatar status lastSeen');

  if (existing) {
    return existing;
  }

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
  if (!name || name.trim().length === 0) throw new Error('Group name required');

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
 * Only admin/moderator allowed
 */
export const updateGroupInfo = async (conversationId, userId, updateFields) => {
  const convo = await Conversation.findById(conversationId);
  if (!convo || convo.type !== 'group') throw new Error('Group conversation not found');

  const participant = convo.getParticipant(userId);
  if (!participant || !['admin', 'moderator'].includes(participant.role)) {
    const error = new Error('Not authorized to update group settings');
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
 * Add participant(s) to group (admin/moderator only)
 */
export const addParticipantsToGroup = async (conversationId, userId, newUserIds = []) => {
  const convo = await Conversation.findById(conversationId);
  if (!convo || convo.type !== 'group') throw new Error('Group conversation not found');

  const participant = convo.getParticipant(userId);
  if (!participant || !['admin', 'moderator'].includes(participant.role)) {
    const error = new Error('Not authorized to add participants');
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
 * Remove participant from group (admin/moderator only or self)
 */
export const removeParticipantFromGroup = async (conversationId, removerId, removeeId) => {
  const convo = await Conversation.findById(conversationId);
  if (!convo || convo.type !== 'group') throw new Error('Group conversation not found');

  const remover = convo.getParticipant(removerId);
  if (!remover) {
    const error = new Error('Unauthorized');
    error.statusCode = 403;
    throw error;
  }

  if (removerId.toString() !== removeeId.toString() && !['admin', 'moderator'].includes(remover.role)) {
    const error = new Error('Not authorized to remove participant');
    error.statusCode = 403;
    throw error;
  }

  await convo.removeParticipant(removeeId);
  return convo;
};

/**
 * Change participant role (admin only)
 */
export const changeParticipantRole = async (conversationId, adminId, participantId, newRole) => {
  const convo = await Conversation.findById(conversationId);
  if (!convo || convo.type !== 'group') throw new Error('Group conversation not found');

  const admin = convo.getParticipant(adminId);
  if (!admin || admin.role !== 'admin') {
    const error = new Error('Only admin can change roles');
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
  if (!convo) throw new Error('Conversation not found');
  const participant = convo.getParticipant(userId);
  if (!participant) {
    const error = new Error('Unauthorized');
    error.statusCode = 403;
    throw error;
  }

  convo.settings.archived = archived;
  await convo.save();
  return convo;
};

/**
 * Search active users excluding requester.
 */
export const searchActiveUsers = async (query, userId) => {
  if (!query || query.length < 2) {
    const error = new Error('Query too short');
    error.statusCode = 400;
    throw error;
  }

  const users = await User.find({
    _id: { $ne: userId },
    isActive: true,
    $or: [{ name: { $regex: query, $options: 'i' } }, { email: { $regex: query, $options: 'i' } }],
  })
    .select('name email avatar status')
    .limit(10);

  return users;
};

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
  searchActiveUsers,
};
