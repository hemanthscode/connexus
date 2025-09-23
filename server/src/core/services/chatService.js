import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

/**
 * Get all active conversations for a user.
 * Includes unread message count per conversation.
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
 * Throws 403 if user is not a participant.
 */
export const getConversationMessages = async (conversationId, userId, { page = 1, limit = 50 }) => {
  const convo = await Conversation.findById(conversationId);
  if (!convo || !convo.hasParticipant(userId)) {
    const error = new Error('Unauthorized');
    error.statusCode = 403;
    throw error;
  }

  const messages = await Message.findConversationMessages(conversationId, page, limit);
  return messages.reverse();
};

/**
 * Send a message in a conversation.
 * Validates participant membership.
 * Returns created message with populated sender.
 * Updates conversation's lastMessage.
 */
export const sendMessageInConversation = async (conversationId, userId, content, type = 'text') => {
  const convo = await Conversation.findById(conversationId);
  if (!convo || !convo.hasParticipant(userId)) {
    const error = new Error('Unauthorized');
    error.statusCode = 403;
    throw error;
  }

  const message = new Message({ content, sender: userId, conversation: conversationId, type });
  await message.save();
  await message.populate('sender', 'name email avatar');

  await convo.updateLastMessage(content, userId);
  return message;
};

/**
 * Mark conversation as read by user.
 * Updates conversation participant lastRead timestamp.
 * Adds user to message readBy arrays.
 */
export const markConversationAsRead = async (conversationId, userId) => {
  const convo = await Conversation.findById(conversationId);
  if (!convo || !convo.hasParticipant(userId)) {
    const error = new Error('Unauthorized');
    error.statusCode = 403;
    throw error;
  }

  // update participant lastRead
  const participant = convo.participants.find((p) => p.user.toString() === userId.toString());
  if (participant) {
    participant.lastRead = new Date();
    await convo.save();
  }

  // mark all unread messages
  const unread = await Message.find({
    conversation: convo._id,
    sender: { $ne: new mongoose.Types.ObjectId(userId) },
    isDeleted: false,
  });

  // Parallelize markAsRead to improve efficiency
  await Promise.all(unread.map((msg) => msg.markAsRead(userId)));
};

/**
 * Create or get an existing direct conversation between two users.
 * Throws 404 if participant user not found.
 */
export const createOrGetDirectConversation = async (userId, participantId) => {
  const participant = await User.findById(participantId);
  if (!participant) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const existing = await Conversation.findOne({
    type: 'direct',
    'participants.user': { $all: [userId, participantId] },
  }).populate('participants.user', 'name email avatar');

  if (existing) return existing;

  const convo = new Conversation({
    type: 'direct',
    participants: [{ user: userId }, { user: participantId }],
    createdBy: userId,
  });
  await convo.save();
  await convo.populate('participants.user', 'name email avatar');

  return convo;
};

/**
 * Search active users by name or email for adding to conversations.
 * Excludes the requesting user.
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
