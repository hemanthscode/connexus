export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AUTH_ENDPOINTS = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  CHANGE_PASSWORD: '/auth/password',
};

export const STORAGE_KEYS = {
  TOKEN: 'connexus_token',
  USER: 'connexus_user',
};

export const USER_STATUS = {
  ONLINE: 'online',
  AWAY: 'away', 
  OFFLINE: 'offline',
};

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  CHAT: '/chat',
  PROFILE: '/profile',
};
