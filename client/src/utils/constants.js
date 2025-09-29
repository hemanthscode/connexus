// Environment helpers
const getEnvVar = (key, defaultValue, type = 'string') => {
  const value = import.meta.env[key] || defaultValue
  
  switch (type) {
    case 'boolean': return value === 'true'
    case 'number': return parseInt(value, 10) || defaultValue
    default: return value
  }
}

// App Configuration
export const APP_CONFIG = {
  NAME: getEnvVar('VITE_APP_NAME', 'Connexus'),
  VERSION: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  DESCRIPTION: getEnvVar('VITE_APP_DESCRIPTION', 'Real-time Chat Application'),
  NODE_ENV: getEnvVar('VITE_NODE_ENV', 'development'),
}

// API Configuration
export const API_CONFIG = {
  BASE_URL: getEnvVar('VITE_API_BASE_URL', 'http://localhost:5000/api'),
  SOCKET_URL: getEnvVar('VITE_SOCKET_URL', 'http://localhost:5000'),
  TIMEOUT: getEnvVar('VITE_API_TIMEOUT', 10000, 'number'),
  RETRY_ATTEMPTS: getEnvVar('VITE_RETRY_ATTEMPTS', 3, 'number'),
  RETRY_DELAY: getEnvVar('VITE_RETRY_DELAY', 1000, 'number'),
}

// API Endpoints - Organized by feature
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    CHANGE_PASSWORD: '/auth/password',
  },
  
  USERS: {
    ME: '/users/me',
    PROFILE: (userId) => `/users/${userId}`,
    SEARCH: '/users/search',
  },
  
  CHAT: {
    // Conversations
    CONVERSATIONS: '/chat/conversations',
    CONVERSATION_MESSAGES: (id) => `/chat/conversations/${id}/messages`,
    DIRECT_CONVERSATION: '/chat/conversations/direct',
    GROUP_CONVERSATION: '/chat/conversations/group',
    ARCHIVE_CONVERSATION: (id) => `/chat/conversations/${id}/archive`,
    
    // Messages
    SEND_MESSAGE: '/chat/messages',
    EDIT_MESSAGE: '/chat/messages/edit',
    DELETE_MESSAGE: (messageId) => `/chat/messages/${messageId}`,
    MARK_READ: (conversationId) => `/chat/conversations/${conversationId}/read`,
    
    // Group Management
    UPDATE_GROUP: (id) => `/chat/conversations/${id}`,
    ADD_PARTICIPANTS: (id) => `/chat/conversations/${id}/participants`,
    REMOVE_PARTICIPANT: (id, participantId) => `/chat/conversations/${id}/participants/${participantId}`,
    CHANGE_ROLE: (id) => `/chat/conversations/${id}/participants/role`,
    
    // Reactions & Search
    ADD_REACTION: '/chat/messages/reactions',
    REMOVE_REACTION: '/chat/messages/reactions/remove',
    SEARCH_USERS: '/chat/users/search',
  },
  
  UPLOAD: {
    FILE: '/upload/file',
    AVATAR: '/upload/avatar',
    ATTACHMENT: '/upload/attachment',
  }
}

// Socket Events - Organized by category
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  PING: 'ping',
  PONG: 'pong',
  
  // User Presence
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  CURRENT_ONLINE_USERS: 'current_online_users',
  USER_STATUS_UPDATED: 'user_status_updated',
  UPDATE_USER_STATUS: 'update_user_status',
  
  // Conversations
  JOIN_CONVERSATION: 'join_conversation',
  LEAVE_CONVERSATION: 'leave_conversation',
  JOINED_CONVERSATION: 'joined_conversation',
  LEFT_CONVERSATION: 'left_conversation',
  
  // Messages
  SEND_MESSAGE: 'send_message',
  NEW_MESSAGE: 'new_message',
  EDIT_MESSAGE: 'edit_message',
  MESSAGE_EDITED: 'message_edited',
  DELETE_MESSAGE: 'delete_message',
  MESSAGE_DELETED: 'message_deleted',
  MARK_MESSAGE_READ: 'mark_message_read',
  MESSAGE_READ: 'message_read',
  
  // Typing & Reactions
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  USER_TYPING: 'user_typing',
  USER_STOP_TYPING: 'user_stop_typing',
  ADD_REACTION: 'add_reaction',
  REMOVE_REACTION: 'remove_reaction',
  REACTION_UPDATED: 'reaction_updated',
  
  // Groups
  JOIN_GROUP: 'join_group',
  LEAVE_GROUP: 'leave_group',
  USER_JOINED_GROUP: 'user_joined_group',
  USER_LEFT_GROUP: 'user_left_group',
  
  // System
  ERROR: 'error',
  REQUEST_CONVERSATION_INFO: 'request_conversation_info',
  CONVERSATION_INFO: 'conversation_info',
}

// UI Configuration
export const UI_CONFIG = {
  // Pagination
  MESSAGES_PER_PAGE: getEnvVar('VITE_MESSAGES_PER_PAGE', 50, 'number'),
  CONVERSATIONS_PER_PAGE: 20,
  USERS_PER_PAGE: 10,
  
  // Timeouts & Intervals
  TYPING_TIMEOUT: getEnvVar('VITE_TYPING_TIMEOUT', 3000, 'number'),
  ONLINE_CHECK_INTERVAL: getEnvVar('VITE_ONLINE_CHECK_INTERVAL', 30000, 'number'),
  NOTIFICATION_TIMEOUT: 5000,
  TOAST_TIMEOUT: 4000,
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 1000,
  
  // Socket
  RECONNECT_ATTEMPTS: getEnvVar('VITE_RECONNECT_ATTEMPTS', 5, 'number'),
  RECONNECT_INTERVAL: getEnvVar('VITE_RECONNECT_INTERVAL', 2000, 'number'),
  
  // Files
  MAX_FILE_SIZE: getEnvVar('VITE_MAX_FILE_SIZE', 10485760, 'number'), // 10MB
  ALLOWED_FILE_TYPES: getEnvVar('VITE_ALLOWED_FILE_TYPES', 'image/*,application/pdf,text/*'),
  
  // Performance
  MESSAGE_CACHE_SIZE: getEnvVar('VITE_MESSAGE_CACHE_SIZE', 1000, 'number'),
  
  // Theme
  DEFAULT_THEME: getEnvVar('VITE_DEFAULT_THEME', 'dark'),
  ENABLE_THEME_SWITCHER: getEnvVar('VITE_ENABLE_THEME_SWITCHER', true, 'boolean'),
}

// Feature Flags
export const FEATURES = {
  NOTIFICATIONS: getEnvVar('VITE_ENABLE_NOTIFICATIONS', true, 'boolean'),
  FILE_UPLOAD: getEnvVar('VITE_ENABLE_FILE_UPLOAD', true, 'boolean'),
  VOICE_MESSAGES: getEnvVar('VITE_ENABLE_VOICE_MESSAGES', false, 'boolean'),
  VIDEO_CALLS: getEnvVar('VITE_ENABLE_VIDEO_CALLS', false, 'boolean'),
  SCREEN_SHARING: getEnvVar('VITE_ENABLE_SCREEN_SHARING', false, 'boolean'),
  LAZY_LOAD_IMAGES: getEnvVar('VITE_LAZY_LOAD_IMAGES', true, 'boolean'),
  INFINITE_SCROLL: getEnvVar('VITE_INFINITE_SCROLL', true, 'boolean'),
}

// Debug Configuration
export const DEBUG = {
  ENABLED: getEnvVar('VITE_DEBUG_MODE', false, 'boolean'),
  SOCKET_LOGS: getEnvVar('VITE_SHOW_SOCKET_LOGS', false, 'boolean'),
  API_LOGS: getEnvVar('VITE_SHOW_API_LOGS', false, 'boolean'),
}

// Enums & Constants
export const USER_STATUS = { ONLINE: 'online', AWAY: 'away', OFFLINE: 'offline' }
export const MESSAGE_TYPES = { TEXT: 'text', IMAGE: 'image', FILE: 'file', SYSTEM: 'system' }
export const MESSAGE_STATUS = { SENDING: 'sending', SENT: 'sent', DELIVERED: 'delivered', READ: 'read', FAILED: 'failed' }
export const CONVERSATION_TYPES = { DIRECT: 'direct', GROUP: 'group' }
export const GROUP_ROLES = { ADMIN: 'admin', MODERATOR: 'moderator', MEMBER: 'member' }

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'connexus_auth_token',
  USER_DATA: 'connexus_user_data',
  THEME: 'connexus_theme',
  CONVERSATIONS_CACHE: 'connexus_conversations_cache',
  MESSAGES_CACHE: 'connexus_messages_cache',
  DRAFT_MESSAGES: 'connexus_draft_messages',
  SETTINGS: 'connexus_settings',
  TYPING_USERS: 'connexus_typing_users',
  ONLINE_USERS: 'connexus_online_users',
}

// Validation Rules
export const VALIDATION_RULES = {
  USERNAME: { MIN_LENGTH: 2, MAX_LENGTH: 50 },
  PASSWORD: { MIN_LENGTH: 6, MAX_LENGTH: 128 },
  EMAIL: { MAX_LENGTH: 255 },
  MESSAGE: { MAX_LENGTH: 2000 },
  GROUP_NAME: { MIN_LENGTH: 1, MAX_LENGTH: 100 },
  GROUP_DESCRIPTION: { MAX_LENGTH: 500 },
  BIO: { MAX_LENGTH: 250 },
  LOCATION: { MAX_LENGTH: 100 },
}

// Messages
export const MESSAGES = {
  ERROR: {
    NETWORK: 'Network connection error. Please check your internet connection.',
    SERVER: 'Server error occurred. Please try again later.',
    AUTH: 'Authentication failed. Please login again.',
    VALIDATION: 'Please check your input and try again.',
    FILE_TOO_LARGE: `File size must be less than ${UI_CONFIG.MAX_FILE_SIZE / 1048576}MB`,
    UNSUPPORTED_FILE: 'Unsupported file type',
    CONNECTION_LOST: 'Connection lost. Attempting to reconnect...',
    RECONNECTION_FAILED: 'Failed to reconnect. Please refresh the page.',
  },
  SUCCESS: {
    LOGIN: 'Successfully logged in',
    REGISTER: 'Account created successfully',
    MESSAGE_SENT: 'Message sent',
    PROFILE_UPDATED: 'Profile updated successfully',
    PASSWORD_CHANGED: 'Password changed successfully',
  }
}

// UI Constants
export const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '👏', '🎉', '💯', '🤔', '😍']
export const ANIMATIONS = { FAST: 150, NORMAL: 300, SLOW: 500, TYPING_INDICATOR: 1500, TOAST: 4000, MODAL: 200 }
export const BREAKPOINTS = { SM: 640, MD: 768, LG: 1024, XL: 1280, '2XL': 1536 }

// Theme Configuration
export const THEMES = {
  DARK: {
    name: 'dark',
    colors: {
      primary: '#0ea5e9',
      background: '#0a0a0a',
      surface: '#1a1a1a',
      card: '#2a2a2a',
      border: '#3a3a3a',
      text: '#ffffff',
      muted: '#888888',
    }
  },
  LIGHT: {
    name: 'light',
    colors: {
      primary: '#0ea5e9',
      background: '#ffffff',
      surface: '#f8fafc',
      card: '#ffffff',
      border: '#e2e8f0',
      text: '#1a202c',
      muted: '#64748b',
    }
  }
}

// Helper to get error message by key
export const getErrorMessage = (key) => MESSAGES.ERROR[key] || 'An unexpected error occurred'
export const getSuccessMessage = (key) => MESSAGES.SUCCESS[key] || 'Operation completed successfully'
