import { DB_POPULATE, DB_SELECTORS } from '../constants/index.js';

/**
 * Common population helper for messages with all related data
 */
export const populateMessageDetails = (query) => {
  return query
    .populate(DB_POPULATE.SENDER)
    .populate(DB_POPULATE.REPLY_TO_WITH_SENDER)
    .populate(DB_POPULATE.REACTIONS_USER);
};

/**
 * Common population helper for conversations
 */
export const populateConversationDetails = (query) => {
  return query
    .populate(DB_POPULATE.PARTICIPANTS)
    .populate(DB_POPULATE.LAST_MESSAGE_SENDER);
};

/**
 * Common population helper for user conversations
 */
export const populateUserConversations = (query) => {
  return populateConversationDetails(query).sort({ 'lastMessage.timestamp': -1 });
};

/**
 * Format reaction data with complete user details
 */
export const formatReactions = (reactions) => {
  return reactions.map(reaction => ({
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
};

/**
 * Common query for finding user's active conversations
 */
export const findUserActiveConversations = (model, userId) => {
  return populateUserConversations(
    model.find({ 
      'participants.user': userId, 
      isActive: true, 
      'settings.archived': false 
    })
  );
};

/**
 * Common query for finding conversation messages with pagination
 */
export const findConversationMessages = (model, conversationId, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;
  return populateMessageDetails(
    model.find({ 
      conversation: conversationId,
      isDeleted: false 
    }).sort({ createdAt: -1 }).skip(skip).limit(limit)
  );
};

export default {
  populateMessageDetails,
  populateConversationDetails,
  populateUserConversations,
  formatReactions,
  findUserActiveConversations,
  findConversationMessages,
};
