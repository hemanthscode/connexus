/**
 * Chat Helper Functions - OPTIMIZED
 * Consolidated utilities with reduced redundancy
 */

import { EMOJIS, TIME, USER_ROLES } from './constants';

// =============================================================================
// Reaction Helpers - OPTIMIZED
// =============================================================================

/**
 * Group reactions by emoji with user details
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
 */
export const hasUserReacted = (reactions, userId) => {
  if (!reactions || !Array.isArray(reactions) || !userId) return false;
  
  return reactions.some(r => {
    const reactionUserId = r.user?._id || r.user;
    return reactionUserId === userId;
  });
};

/**
 * Get user's reaction for specific emoji
 */
export const getUserReaction = (reactions, userId, emoji) => {
  if (!reactions || !Array.isArray(reactions) || !userId) return null;
  
  return reactions.find(r => {
    const reactionUserId = r.user?._id || r.user;
    return reactionUserId === userId && r.emoji === emoji;
  });
};

/**
 * Get reaction count for emoji
 */
export const getReactionCount = (reactions, emoji) => {
  if (!reactions || !Array.isArray(reactions)) return 0;
  return reactions.filter(r => r.emoji === emoji).length;
};

/**
 * Get emoji options for different contexts - CONSOLIDATED
 */
export const getEmojiOptions = (context = 'reactions') => {
  switch (context) {
    case 'reactions':
      return EMOJIS.REACTIONS.slice(0, 8); // Quick reactions
    case 'input':
      return EMOJIS.INPUT; // Full emoji picker
    case 'quick':
      return EMOJIS.REACTIONS.slice(0, 6); // Even quicker
    default:
      return EMOJIS.REACTIONS;
  }
};

// =============================================================================
// Message Helpers - OPTIMIZED
// =============================================================================

/**
 * Get message status with enhanced logic
 */
export const getMessageStatus = (message) => {
  if (!message) return 'sent';
  
  if (message.isOptimistic) return 'sending';
  if (message.status === 'failed') return 'failed';
  if (message.readBy?.length > 0) return 'read';
  return message.status || 'sent';
};

/**
 * Check if message should be grouped with previous - ENHANCED
 */
export const shouldGroupMessages = (currentMessage, previousMessage, groupTimeLimit = TIME.MESSAGE_GROUP_TIME) => {
  if (!currentMessage || !previousMessage) return false;
  
  const isSameSender = previousMessage.sender?._id === currentMessage.sender?._id;
  const timeDiff = new Date(currentMessage.createdAt) - new Date(previousMessage.createdAt);
  const isWithinTimeLimit = timeDiff < groupTimeLimit;
  const isSameType = (currentMessage.type || 'text') === (previousMessage.type || 'text');
  
  return isSameSender && isWithinTimeLimit && isSameType;
};

/**
 * Extract message preview with enhanced formatting
 */
export const getMessagePreview = (message, maxLength = 50) => {
  if (!message) return '';
  
  let preview = '';
  
  switch (message.type) {
    case 'image':
      preview = '📷 Image';
      break;
    case 'file':
      preview = '📄 File';
      break;
    case 'voice':
      preview = '🎤 Voice message';
      break;
    case 'video':
      preview = '🎥 Video';
      break;
    case 'system':
      preview = message.content || 'System message';
      break;
    default:
      preview = message.content || '';
  }
  
  return preview.length > maxLength ? preview.slice(0, maxLength) + '...' : preview;
};

/**
 * Check if message is editable
 */
export const isMessageEditable = (message, currentUserId, timeLimit = 15 * 60 * 1000) => {
  if (!message || !currentUserId) return false;
  if (message.sender?._id !== currentUserId) return false;
  if (message.type !== 'text') return false;
  if (message.isDeleted) return false;
  
  const messageAge = Date.now() - new Date(message.createdAt).getTime();
  return messageAge < timeLimit;
};

// =============================================================================
// User & Search Helpers - CONSOLIDATED
// =============================================================================

/**
 * Filter search results excluding existing conversation partners
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
 * Get user details safely with fallbacks
 */
export const getUserDetails = (userOrReaction) => {
  if (!userOrReaction) return { _id: null, name: 'Unknown User', email: '', avatar: null };
  
  // Direct user object
  if (userOrReaction.name) return userOrReaction;
  
  // Reaction with user details
  if (userOrReaction.userDetails) return userOrReaction.userDetails;
  
  // Reaction with populated user
  if (userOrReaction.user && typeof userOrReaction.user === 'object') return userOrReaction.user;
  
  // Fallback for ID-only references
  return {
    _id: userOrReaction.user || userOrReaction._id,
    name: 'Unknown User',
    email: '',
    avatar: null
  };
};

/**
 * Check if users are the same across different data structures
 */
export const isSameUser = (user1, user2) => {
  if (!user1 || !user2) return false;
  
  const getId = (user) => {
    return user._id || user.user?._id || user.user || user;
  };
  
  return getId(user1) === getId(user2);
};

// =============================================================================
// Typing Indicator Helpers - ENHANCED
// =============================================================================

/**
 * Format typing indicator text with smart pluralization
 */
export const formatTypingText = (typingUsers, currentUserId) => {
  if (!typingUsers || !Array.isArray(typingUsers)) return '';
  
  const otherTyping = typingUsers.filter(user => user._id !== currentUserId);
  
  if (otherTyping.length === 0) return '';
  if (otherTyping.length === 1) return `${otherTyping[0].name} is typing...`;
  if (otherTyping.length === 2) return `${otherTyping[0].name} and ${otherTyping[1].name} are typing...`;
  return `${otherTyping[0].name} and ${otherTyping.length - 1} others are typing...`;
};

/**
 * Get typing user names for display
 */
export const getTypingUserNames = (typingUsers, currentUserId, maxNames = 2) => {
  if (!typingUsers || !Array.isArray(typingUsers)) return [];
  
  const otherTyping = typingUsers.filter(user => user._id !== currentUserId);
  return otherTyping.slice(0, maxNames).map(user => user.name);
};

/**
 * Check if conversation has any typing users
 */
export const hasTypingUsers = (typingUsers, currentUserId) => {
  if (!typingUsers || !Array.isArray(typingUsers)) return false;
  return typingUsers.filter(user => user._id !== currentUserId).length > 0;
};

// =============================================================================
// Permission & Role Helpers - NEW
// =============================================================================

/**
 * Check if user has permission in group
 */
export const hasGroupPermission = (group, userId, permission) => {
  if (!group || !userId) return false;
  
  const participant = group.participants?.find(p => p.user._id === userId);
  if (!participant) return false;
  
  const role = participant.role;
  
  switch (permission) {
    case 'admin':
      return role === USER_ROLES.ADMIN;
    case 'moderate':
      return role === USER_ROLES.ADMIN || role === USER_ROLES.MODERATOR;
    case 'member':
      return role === USER_ROLES.ADMIN || role === USER_ROLES.MODERATOR || role === USER_ROLES.MEMBER;
    default:
      return false;
  }
};

/**
 * Get user role in group
 */
export const getUserRole = (group, userId) => {
  if (!group || !userId) return USER_ROLES.GUEST;
  
  const participant = group.participants?.find(p => p.user._id === userId);
  return participant?.role || USER_ROLES.GUEST;
};

/**
 * Check if user can perform action on group
 */
export const canPerformGroupAction = (group, userId, action) => {
  const userRole = getUserRole(group, userId);
  
  const permissions = {
    'edit_info': [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
    'add_members': [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
    'remove_members': [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
    'change_roles': [USER_ROLES.ADMIN],
    'delete_group': [USER_ROLES.ADMIN],
    'manage_settings': [USER_ROLES.ADMIN],
  };
  
  return permissions[action]?.includes(userRole) || false;
};

// =============================================================================
// Conversation Helpers - NEW
// =============================================================================

/**
 * Get conversation display name
 */
export const getConversationName = (conversation, currentUserId) => {
  if (!conversation) return 'Unknown';
  
  if (conversation.type === 'group') {
    return conversation.name || 'Group Chat';
  }
  
  const otherParticipant = conversation.participants?.find(p => p.user?._id !== currentUserId);
  return otherParticipant?.user?.name || 'Unknown User';
};

/**
 * Get conversation avatar
 */
export const getConversationAvatar = (conversation, currentUserId) => {
  if (!conversation) return null;
  
  if (conversation.type === 'group') {
    return conversation.avatar || null;
  }
  
  const otherParticipant = conversation.participants?.find(p => p.user?._id !== currentUserId);
  return otherParticipant?.user?.avatar || null;
};

/**
 * Check if conversation is active/selected
 */
export const isConversationActive = (conversationId, activeConversationId, temporaryConversation) => {
  if (temporaryConversation?.type && conversationId === temporaryConversation._id) return true;
  return conversationId === activeConversationId;
};

// =============================================================================
// Search & Filter Helpers - CONSOLIDATED
// =============================================================================

/**
 * Search conversations by name and content
 */
export const searchConversations = (conversations, query, currentUserId) => {
  if (!query || !conversations) return [];
  
  const lowercaseQuery = query.toLowerCase();
  
  return conversations.filter(conv => {
    const name = getConversationName(conv, currentUserId);
    const content = conv.lastMessage?.content || '';
    
    return name.toLowerCase().includes(lowercaseQuery) || 
           content.toLowerCase().includes(lowercaseQuery);
  });
};

/**
 * Filter conversations by type and status
 */
export const filterConversations = (conversations, filter, getUnreadCount) => {
  if (!conversations) return [];
  
  switch (filter) {
    case 'unread':
      return conversations.filter(conv => getUnreadCount?.(conv._id) > 0);
    case 'groups':
      return conversations.filter(conv => conv.type === 'group');
    case 'direct':
      return conversations.filter(conv => conv.type === 'direct');
    case 'archived':
      return conversations.filter(conv => conv.archived);
    default:
      return conversations;
  }
};

// =============================================================================
// Export with organized structure
// =============================================================================
export const reactionHelpers = {
  groupReactionsByEmoji,
  hasUserReacted,
  getUserReaction,
  getReactionCount,
  getEmojiOptions,
};

export const messageHelpers = {
  getMessageStatus,
  shouldGroupMessages,
  getMessagePreview,
  isMessageEditable,
};

export const userHelpers = {
  filterNewUsers,
  getUserDetails,
  isSameUser,
};

export const typingHelpers = {
  formatTypingText,
  getTypingUserNames,
  hasTypingUsers,
};

export const permissionHelpers = {
  hasGroupPermission,
  getUserRole,
  canPerformGroupAction,
};

export const conversationHelpers = {
  getConversationName,
  getConversationAvatar,
  isConversationActive,
  searchConversations,
  filterConversations,
};

// Default exports for backward compatibility
export default {
  ...reactionHelpers,
  ...messageHelpers,
  ...userHelpers,
  ...typingHelpers,
  ...permissionHelpers,
  ...conversationHelpers,
};
