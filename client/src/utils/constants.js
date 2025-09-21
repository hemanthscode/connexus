export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Connexus'

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system'
}

export const USER_STATUS = {
  ONLINE: 'online',
  AWAY: 'away',
  OFFLINE: 'offline'
}

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  CHAT: '/chat',
  PROFILE: '/profile'
}
