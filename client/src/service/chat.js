import api from './api.js'

export const fetchConversations = async () => {
  const response = await api.get('/chat/conversations')
  return response.data.data
}

export const fetchMessages = async (conversationId) => {
  const response = await api.get(`/chat/conversations/${conversationId}/messages`)
  return response.data.data
}

export const sendMessage = async (conversationId, content, type = 'text') => {
  const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
    content,
    type,
  })
  return response.data.data
}
