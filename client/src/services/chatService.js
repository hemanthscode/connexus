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
    headers: { Authorization: `Bearer ${token}` }
  })
  return parseResponse(res)
}

export async function getMessages(conversationId, token) {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return parseResponse(res)
}
