// src/services/chatService.js
const API_BASE = import.meta.env.VITE_API_CHAT_BASE_URL || 'http://localhost:5000/api/chat'

async function parseResponse(res) {
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(json?.message || 'API endpoint not found')
  }
  return json.data
}

export async function getConversations(token) {
  const res = await fetch(`${API_BASE}/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return parseResponse(res)
}

export async function getMessages(conversationId, token) {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return parseResponse(res)
}

export async function createDirectConversation(participantId, token) {
  const res = await fetch(`${API_BASE}/conversations/direct`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ participantId }),
  })
  return parseResponse(res)
}

export async function markAsRead(conversationId, token) {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}/read`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  })
  return parseResponse(res)
}

export async function searchUsers(query, token) {
  const url = new URL(`${API_BASE}/users/search`)
  url.searchParams.set('q', query)

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })
  return parseResponse(res)
}
