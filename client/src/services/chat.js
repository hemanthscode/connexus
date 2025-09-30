import api from './api';

export const chatService = {
  // Get user conversations
  getConversations: () => {
    return api.get('/chat/conversations');
  },

  // Get conversation messages
  getMessages: (conversationId, { page = 1, limit = 50 } = {}) => {
    return api.get(`/chat/conversations/${conversationId}/messages`, {
      params: { page, limit }
    });
  },

  // Send message
  sendMessage: (messageData) => {
    return api.post('/chat/messages', messageData);
  },

  // Edit message
  editMessage: (data) => {
    return api.put('/chat/messages/edit', data);
  },

  // Delete message
  deleteMessage: (messageId) => {
    return api.delete(`/chat/messages/${messageId}`);
  },

  // Mark conversation as read
  markConversationAsRead: (conversationId) => {
    return api.put(`/chat/conversations/${conversationId}/read`);
  },

  // Add reaction
  addReaction: (messageId, emoji) => {
    return api.post('/chat/messages/reactions', { messageId, emoji });
  },

  // Remove reaction
  removeReaction: (messageId, emoji) => {
    return api.post('/chat/messages/reactions/remove', { messageId, emoji });
  },

  // Create direct conversation
  createDirectConversation: (data) => {
    return api.post('/chat/conversations/direct', data);
  },

  // Create group conversation
  createGroup: (data) => {
    return api.post('/chat/conversations/group', data);
  },

  // Update group
  updateGroup: (groupId, data) => {
    return api.put(`/chat/conversations/${groupId}`, data);
  },

  // Add participants to group
  addGroupParticipants: (groupId, participants) => {
    return api.post(`/chat/conversations/${groupId}/participants`, { participants });
  },

  // Remove participant from group
  removeGroupParticipant: (groupId, participantId) => {
    return api.delete(`/chat/conversations/${groupId}/participants/${participantId}`);
  },

  // Change participant role
  changeParticipantRole: (groupId, participantId, role) => {
    return api.put(`/chat/conversations/${groupId}/participants/role`, { participantId, role });
  },

  // Archive conversation
  archiveConversation: (conversationId, archived) => {
    return api.put(`/chat/conversations/${conversationId}/archive`, { archived });
  },

  // Search users
  searchUsers: (params) => {
    return api.get('/chat/users/search', { params });
  },

  // Get conversation info
  getConversationInfo: (conversationId) => {
    return api.get(`/chat/conversations/${conversationId}`);
  },

  // Leave group
  leaveGroup: (groupId) => {
    return api.post(`/chat/conversations/${groupId}/leave`);
  },

  // Upload file/attachment
  uploadFile: (file, conversationId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);
    
    return api.post('/chat/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get user profile
  getUserProfile: (userId) => {
    return api.get(`/users/${userId}`);
  },
};
