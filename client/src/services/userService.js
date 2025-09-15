// src/services/userService.js
const API_BASE = import.meta.env.VITE_API_AUTH_BASE_URL || 'http://localhost:5000/api/auth'

async function parseResponse(res) {
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(json?.message || 'Request failed')
  }
  return json.data
}

export async function updateProfile(data, token) {
  const res = await fetch(`${API_BASE}/me`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  return parseResponse(res)
}

export async function changePassword(data, token) {
  const res = await fetch(`${API_BASE}/password`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  return parseResponse(res)
}
