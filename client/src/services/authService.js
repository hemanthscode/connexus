// src/services/authService.js
const API_BASE = import.meta.env.VITE_API_AUTH_BASE_URL || 'http://localhost:5000/api/auth'

async function parseResponse(res) {
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const message = json?.message || 'Request failed'
    throw new Error(message)
  }
  return json.data
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return parseResponse(res)
}

export async function register(name, email, password) {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  return parseResponse(res)
}

export async function fetchProfile(token) {
  const res = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return parseResponse(res)
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
