/**
 * Chat Service - OPTIMIZED WITH UTILITIES
 * Enhanced API calls with validation and sanitization
 */
import api, { apiHelpers } from './api';
import { CHAT_ENDPOINTS, USER_ENDPOINTS, PAGINATION } from '../utils/constants';
import { sanitizers, validateFormData, chatValidation, fileValidation } from '../utils/validation';
import { formatError } from '../utils/formatters';

// ENHANCED: Helper functions with validation
const buildConversationUrl = (conversationId, endpoint = '') => 
  `${CHAT_ENDPOINTS.CONVERSATIONS}/${conversationId}${endpoint}`;

const buildMessageUrl = (messageId) => 
  apiHelpers.buildUrl(CHAT_ENDPOINTS.DELETE_MESSAGE, { messageId });

// ENHANCED: Service operations with validation and sanitization
const conversationOps = {
  getAll: () => api.get(CHAT_ENDPOINTS.CONVERSATIONS),
  
  getById: (conversationId) => api.get(buildConversationUrl(conversationId)),
  
  createDirect: async (data) => {
    if (!data.participantId) {
      throw new Error('Participant ID is required');
    }
    return api.post(CHAT_ENDPOINTS.DIRECT_CONVERSATION, data);
  },
  
  // ENHANCED: Create group with validation
  createGroup: async (data) => {
    const validation = validateFormData(data, {
      name: chatValidation.groupName,
      description: chatValidation.groupDescription
    });

    if (!validation.isValid) {
      const error = new Error(Object.values(validation.errors)[0]);
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    const sanitizedData = {
      name: sanitizers.name(data.name),
      description: sanitizers.message(data.description || ''),
      participants: data.participants || []
    };

    return api.post(CHAT_ENDPOINTS.GROUP_CONVERSATION, sanitizedData);
  },
  
  // ENHANCED: Update with sanitization
  update: async (conversationId, data) => {
    const sanitizedData = {
      ...data,
      ...(data.name && { name: sanitizers.name(data.name) }),
      ...(data.description && { description: sanitizers.message(data.description) })
    };

    return api.put(buildConversationUrl(conversationId), sanitizedData);
  },
  
  archive: (conversationId, archived) => 
    api.put(buildConversationUrl(conversationId, '/archive'), { archived }),
  
  markAsRead: (conversationId) => {
    const url = apiHelpers.buildUrl(CHAT_ENDPOINTS.MARK_READ, { id: conversationId });
    return api.put(url);
  }
};

const messageOps = {
  // ENHANCED: Get messages with pagination constants
  getMessages: (conversationId, params = {}) => {
    const url = apiHelpers.buildUrl(CHAT_ENDPOINTS.MESSAGES, { id: conversationId });
    return api.get(url, { 
      params: { 
        page: 1, 
        limit: PAGINATION.MESSAGES_LIMIT, 
        ...params 
      } 
    });
  },
  
  // ENHANCED: Send with sanitization
  send: async (messageData) => {
    const sanitizedData = {
      ...messageData,
      content: sanitizers.message(messageData.content)
    };

    if (!sanitizedData.content) {
      throw new Error('Message content is required');
    }

    return api.post(CHAT_ENDPOINTS.SEND_MESSAGE, sanitizedData);
  },
  
  // ENHANCED: Edit with sanitization and validation
  edit: async (data) => {
    const validation = validateFormData(data, {
      newContent: chatValidation.message
    });

    if (!validation.isValid) {
      const error = new Error(validation.errors.newContent);
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    const sanitizedData = {
      ...data,
      newContent: sanitizers.message(data.newContent)
    };

    return api.put(CHAT_ENDPOINTS.EDIT_MESSAGE, sanitizedData);
  },
  
  delete: (messageId) => api.delete(buildMessageUrl(messageId)),
  
  addReaction: (messageId, emoji) => 
    api.post(CHAT_ENDPOINTS.REACTIONS, { messageId, emoji }),
  
  removeReaction: (messageId, emoji) => 
    api.post(`${CHAT_ENDPOINTS.REACTIONS}/remove`, { messageId, emoji }),
};

const groupOps = {
  update: conversationOps.update,
  
  addParticipants: (groupId, participants) => {
    if (!Array.isArray(participants) || participants.length === 0) {
      throw new Error('At least one participant is required');
    }
    return api.post(buildConversationUrl(groupId, '/participants'), { participants });
  },
  
  removeParticipant: (groupId, participantId) => 
    api.delete(buildConversationUrl(groupId, `/participants/${participantId}`)),
  
  changeRole: (groupId, participantId, role) => 
    api.put(buildConversationUrl(groupId, '/participants/role'), { participantId, role }),
  
  leave: (groupId) => api.post(buildConversationUrl(groupId, '/leave')),
  
  delete: (groupId) => api.delete(buildConversationUrl(groupId)),
};

const userOps = {
  // ENHANCED: Search with validation
  search: async (params) => {
    if (params.q) {
      const validation = validateFormData(params, {
        q: chatValidation.searchQuery
      });

      if (!validation.isValid) {
        throw new Error(validation.errors.q);
      }

      params.q = sanitizers.searchQuery(params.q);
    }

    return api.get(CHAT_ENDPOINTS.SEARCH_USERS, { params });
  },
  
  getProfile: (userId) => api.get(`${USER_ENDPOINTS.PROFILE}/${userId}`),
  block: (userId) => api.post(USER_ENDPOINTS.BLOCK, { userId }),
  unblock: (userId) => api.post(USER_ENDPOINTS.UNBLOCK, { userId }),
};

// ENHANCED: File operations with validation
const fileOps = {
  upload: async (file, conversationId, type = 'attachment') => {
    let validationRules;
    
    switch (type) {
      case 'image':
        validationRules = fileValidation.image;
        break;
      case 'document':
        validationRules = fileValidation.document;
        break;
      case 'video':
        validationRules = fileValidation.video;
        break;
      case 'audio':
        validationRules = fileValidation.audio;
        break;
      default:
        validationRules = fileValidation.document; // Default fallback
    }

    const fileValidationResult = validateFile(file, validationRules);
    
    if (!fileValidationResult.isValid) {
      const error = new Error(fileValidationResult.errors.join(', '));
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    const formData = apiHelpers.createFormData({ 
      file, 
      conversationId, 
      type 
    });
    
    return api.post('/chat/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
  },
  
  uploadAvatar: async (file) => {
    const fileValidationResult = validateFile(file, fileValidation.avatar);
    
    if (!fileValidationResult.isValid) {
      const error = new Error(fileValidationResult.errors.join(', '));
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    const formData = apiHelpers.createFormData({ file });
    
    return api.post(USER_ENDPOINTS.UPLOAD_AVATAR, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
  },
};

// ENHANCED: Main service with error handling wrapper
const withErrorHandling = (fn) => async (...args) => {
  try {
    return await fn(...args);
  } catch (error) {
    throw new Error(formatError(error));
  }
};

export const chatService = {
  // Conversations
  getConversations: withErrorHandling(conversationOps.getAll),
  getConversationInfo: withErrorHandling(conversationOps.getById),
  createDirectConversation: withErrorHandling(conversationOps.createDirect),
  createGroup: withErrorHandling(conversationOps.createGroup),
  updateConversation: withErrorHandling(conversationOps.update),
  archiveConversation: withErrorHandling(conversationOps.archive),
  markConversationAsRead: withErrorHandling(conversationOps.markAsRead),
  
  // Messages
  getMessages: withErrorHandling(messageOps.getMessages),
  sendMessage: withErrorHandling(messageOps.send),
  editMessage: withErrorHandling(messageOps.edit),
  deleteMessage: withErrorHandling(messageOps.delete),
  addReaction: withErrorHandling(messageOps.addReaction),
  removeReaction: withErrorHandling(messageOps.removeReaction),
  
  // Groups
  updateGroup: withErrorHandling(groupOps.update),
  addGroupParticipants: withErrorHandling(groupOps.addParticipants),
  removeGroupParticipant: withErrorHandling(groupOps.removeParticipant),
  changeParticipantRole: withErrorHandling(groupOps.changeRole),
  leaveGroup: withErrorHandling(groupOps.leave),
  deleteGroup: withErrorHandling(groupOps.delete),
  
  // Users
  searchUsers: withErrorHandling(userOps.search),
  getUserProfile: withErrorHandling(userOps.getProfile),
  blockUser: withErrorHandling(userOps.block),
  unblockUser: withErrorHandling(userOps.unblock),
  
  // Files
  uploadFile: withErrorHandling(fileOps.upload),
  uploadAvatar: withErrorHandling(fileOps.uploadAvatar),
  
  // Utilities
  buildConversationUrl,
  buildMessageUrl,
};

export default chatService;
