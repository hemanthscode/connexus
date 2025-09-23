import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
});

const getAuthHeaders = () => {
  const token = localStorage.getItem('connexus_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getConversations = async () => {
  const res = await api.get('/chat/conversations', { headers: getAuthHeaders() });
  return res.data.data;
};

export const createDirectConversation = async (participantId) => {
  const res = await api.post('/chat/conversations/direct', { participantId }, { headers: getAuthHeaders() });
  return res.data.data;
};

export const getMessages = async (conversationId, page = 1, limit = 50) => {
  const res = await api.get(`/chat/conversations/${conversationId}/messages`, {
    headers: getAuthHeaders(),
    params: { page, limit },
  });
  return res.data.data;
};

export const markConversationAsRead = async (conversationId) => {
  await api.put(`/chat/conversations/${conversationId}/read`, null, { headers: getAuthHeaders() });
};

// Send message via REST fallback; for optimistic UI, use sockets directly
export const sendMessage = async ({ conversationId, content, type = 'text' }) => {
  const res = await api.post('/chat/messages', { conversationId, content, type }, { headers: getAuthHeaders() });
  return res.data.data;
};

// Search users API
export const searchUsers = async (query) => {
  const res = await api.get('/chat/users/search', {
    headers: getAuthHeaders(),
    params: { q: query },
  });
  return res.data.data;
};

// New REST APIs that might be useful for reactions fallback if needed
export const addReaction = async (messageId, emoji) => {
  const res = await api.post(`/chat/messages/${messageId}/reactions`, { emoji }, { headers: getAuthHeaders() });
  return res.data.data;
};

export const removeReaction = async (messageId, emoji) => {
  const res = await api.delete(`/chat/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, { headers: getAuthHeaders() });
  return res.data.data;
};
