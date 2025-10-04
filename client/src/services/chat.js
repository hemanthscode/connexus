/**
 * Chat Service
 * Handles all chat-related API calls
 */

import api, { apiHelpers } from './api';
import { CHAT_ENDPOINTS, USER_ENDPOINTS } from '../utils/constants';

export const chatService = {
  // ============== Conversations ==============
  
  getConversations: () => api.get(CHAT_ENDPOINTS.CONVERSATIONS),
  
  createDirectConversation: (data) => 
    api.post(CHAT_ENDPOINTS.DIRECT_CONVERSATION, data),
  
  createGroup: (data) => 
    api.post(CHAT_ENDPOINTS.GROUP_CONVERSATION, data),
  
  getConversationInfo: (conversationId) => 
    api.get(`${CHAT_ENDPOINTS.CONVERSATIONS}/${conversationId}`),
  
  archiveConversation: (conversationId, archived) => 
    api.put(`${CHAT_ENDPOINTS.CONVERSATIONS}/${conversationId}/archive`, { archived }),
  
  // ============== Messages ==============
  
  getMessages: (conversationId, params = {}) => {
    const url = apiHelpers.buildUrl(CHAT_ENDPOINTS.MESSAGES, { id: conversationId });
    return api.get(url, { params: { page: 1, limit: 50, ...params } });
  },
  
  sendMessage: (messageData) => 
    api.post(CHAT_ENDPOINTS.SEND_MESSAGE, messageData),
  
  editMessage: (data) => 
    api.put(CHAT_ENDPOINTS.EDIT_MESSAGE, data),
  
  deleteMessage: (messageId) => {
    const url = apiHelpers.buildUrl(CHAT_ENDPOINTS.DELETE_MESSAGE, { messageId });
    return api.delete(url);
  },
  
  markConversationAsRead: (conversationId) => {
    const url = apiHelpers.buildUrl(CHAT_ENDPOINTS.MARK_READ, { id: conversationId });
    return api.put(url);
  },
  
  // ============== Reactions ==============
  
  addReaction: (messageId, emoji) => 
    api.post(CHAT_ENDPOINTS.REACTIONS, { messageId, emoji }),
  
  removeReaction: (messageId, emoji) => 
    api.post(`${CHAT_ENDPOINTS.REACTIONS}/remove`, { messageId, emoji }),
  
  // ============== Groups ==============
  
  updateGroup: (groupId, data) => 
    api.put(`${CHAT_ENDPOINTS.CONVERSATIONS}/${groupId}`, data),
  
  addGroupParticipants: (groupId, participants) => 
    api.post(`${CHAT_ENDPOINTS.CONVERSATIONS}/${groupId}/participants`, { participants }),
  
  removeGroupParticipant: (groupId, participantId) => 
    api.delete(`${CHAT_ENDPOINTS.CONVERSATIONS}/${groupId}/participants/${participantId}`),
  
  changeParticipantRole: (groupId, participantId, role) => 
    api.put(`${CHAT_ENDPOINTS.CONVERSATIONS}/${groupId}/participants/role`, { participantId, role }),
  
  leaveGroup: (groupId) => 
    api.post(`${CHAT_ENDPOINTS.CONVERSATIONS}/${groupId}/leave`),
  
  // ============== Users & Search ==============
  
  searchUsers: (params) => 
    api.get(CHAT_ENDPOINTS.SEARCH_USERS, { params }),
  
  getUserProfile: (userId) => 
    api.get(`${USER_ENDPOINTS.PROFILE}/${userId}`),
  
  // ============== File Upload ==============
  
  uploadFile: (file, conversationId, type = 'attachment') => {
    const formData = apiHelpers.createFormData({ 
      file, 
      conversationId, 
      type 
    });
    
    return api.post('/chat/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // Longer timeout for uploads
    });
  },
};

export default chatService;
