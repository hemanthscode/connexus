/**
 * Chat Helper Functions
 * Shared utilities for chat functionality
 */

import { REACTION_EMOJIS } from './constants';

/**
 * Group reactions by emoji
 * @param {Array} reactions - Array of reaction objects
 * @returns {Object} Grouped reactions
 */
export const groupReactionsByEmoji = (reactions) => {
  if (!reactions || !Array.isArray(reactions)) return {};
  
  return reactions.reduce((groups, reaction) => {
    if (!groups[reaction.emoji]) {
      groups[reaction.emoji] = [];
    }
    groups[reaction.emoji].push(reaction);
    return groups;
  }, {});
};

/**
 * Check if user has reacted with specific emoji
 * @param {Array} reactions - Array of reactions for that emoji
 * @param {string} userId - Current user ID
 * @returns {boolean} Whether user has reacted
 */
export const hasUserReacted = (reactions, userId) => {
  if (!reactions || !Array.isArray(reactions) || !userId) return false;
  
  return reactions.some(r => {
    const reactionUserId = r.user?._id || r.user;
    return reactionUserId === userId;
  });
};

/**
 * Get message status icon type
 * @param {Object} message - Message object
 * @returns {string} Status type
 */
export const getMessageStatus = (message) => {
  if (!message) return 'sent';
  
  if (message.isOptimistic) return 'sending';
  if (message.status === 'failed') return 'failed';
  if (message.readBy?.length > 0) return 'read';
  return message.status || 'sent';
};

/**
 * Check if message should be grouped with previous
 * @param {Object} currentMessage - Current message
 * @param {Object} previousMessage - Previous message
 * @param {number} groupTimeLimit - Time limit for grouping in ms (default: 5 minutes)
 * @returns {boolean} Whether messages should be grouped
 */
export const shouldGroupMessages = (currentMessage, previousMessage, groupTimeLimit = 300000) => {
  if (!currentMessage || !previousMessage) return false;
  
  const isSameSender = previousMessage.sender?._id === currentMessage.sender?._id;
  const timeDiff = new Date(currentMessage.createdAt) - new Date(previousMessage.createdAt);
  const isWithinTimeLimit = timeDiff < groupTimeLimit;
  
  return isSameSender && isWithinTimeLimit;
};

/**
 * Filter search results excluding existing conversation partners
 * @param {Array} searchResults - Search results array
 * @param {Array} conversations - Existing conversations
 * @param {string} currentUserId - Current user ID
 * @returns {Array} Filtered search results
 */
export const filterNewUsers = (searchResults, conversations, currentUserId) => {
  if (!searchResults || !Array.isArray(searchResults)) return [];
  
  const existingUserIds = conversations
    .filter(conv => conv.type === 'direct')
    .map(conv => {
      const otherParticipant = conv.participants?.find(p => p.user?._id !== currentUserId);
      return otherParticipant?.user?._id;
    })
    .filter(Boolean);

  return searchResults.filter(
    user => !existingUserIds.includes(user._id) && user._id !== currentUserId
  );
};

/**
 * Get default emoji options for reactions
 * @returns {Array} Array of emoji strings
 */
export const getDefaultEmojiOptions = () => {
  return REACTION_EMOJIS.slice(0, 8); // Use first 8 from constants
};

/**
 * Format typing indicator text
 * @param {Array} typingUsers - Array of typing users
 * @param {string} currentUserId - Current user ID to filter out
 * @returns {string} Formatted typing text
 */
export const formatTypingText = (typingUsers, currentUserId) => {
  if (!typingUsers || !Array.isArray(typingUsers)) return '';
  
  const otherTyping = typingUsers.filter(user => user._id !== currentUserId);
  
  if (otherTyping.length === 0) return '';
  if (otherTyping.length === 1) return `${otherTyping[0].name} is typing...`;
  if (otherTyping.length === 2) return `${otherTyping[0].name} and ${otherTyping[1].name} are typing...`;
  return `${otherTyping[0].name} and ${otherTyping.length - 1} others are typing...`;
};

export default {
  groupReactionsByEmoji,
  hasUserReacted,
  getMessageStatus,
  shouldGroupMessages,
  filterNewUsers,
  getDefaultEmojiOptions,
  formatTypingText,
};
