// App Configuration Constants
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'Connexus',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  DESCRIPTION: import.meta.env.VITE_APP_DESCRIPTION || 'Real-time Chat Application',
  NODE_ENV: import.meta.env.VITE_NODE_ENV || 'development',
}

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
}

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    CHANGE_PASSWORD: '/auth/password',
  },
  
  // User endpoints
  USERS: {
    ME: '/users/me',
    PROFILE: (userId) => `/users/${userId}`,
    SEARCH: '/users/search',
  },
  
  // Chat endpoints
  CHAT: {
    CONVERSATIONS: '/chat/conversations',
    CONVERSATION_MESSAGES: (id) => `/chat/conversations/${id}/messages`,
    SEND_MESSAGE: '/chat/messages',
    EDIT_MESSAGE: '/chat/messages/edit',
    DELETE_MESSAGE: (messageId) => `/chat/messages/${messageId}`,
    MARK_READ: (conversationId) => `/chat/conversations/${conversationId}/read`,
    
    // Direct conversations
    DIRECT_CONVERSATION: '/chat/conversations/direct',
    
    // Group conversations
    GROUP_CONVERSATION: '/chat/conversations/group',
    UPDATE_GROUP: (id) => `/chat/conversations/${id}`,
    ADD_PARTICIPANTS: (id) => `/chat/conversations/${id}/participants`,
    REMOVE_PARTICIPANT: (id, participantId) => `/chat/conversations/${id}/participants/${participantId}`,
    CHANGE_ROLE: (id) => `/chat/conversations/${id}/participants/role`,
    ARCHIVE_CONVERSATION: (id) => `/chat/conversations/${id}/archive`,
    
    // Reactions
    ADD_REACTION: '/chat/messages/reactions',
    REMOVE_REACTION: '/chat/messages/reactions/remove',
    
    // Search
    SEARCH_USERS: '/chat/users/search',
  },
  
  // Upload endpoints (future use)
  UPLOAD: {
    FILE: '/upload/file',
    AVATAR: '/upload/avatar',
    ATTACHMENT: '/upload/attachment',
  }
}

// Socket.IO Event Names
export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  
  // User presence events
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  CURRENT_ONLINE_USERS: 'current_online_users',
  USER_STATUS_UPDATED: 'user_status_updated',
  UPDATE_USER_STATUS: 'update_user_status',
  
  // Conversation events
  JOIN_CONVERSATION: 'join_conversation',
  LEAVE_CONVERSATION: 'leave_conversation',
  JOINED_CONVERSATION: 'joined_conversation',
  LEFT_CONVERSATION: 'left_conversation',
  REQUEST_CONVERSATION_INFO: 'request_conversation_info',
  CONVERSATION_INFO: 'conversation_info',
  
  // Message events
  SEND_MESSAGE: 'send_message',
  NEW_MESSAGE: 'new_message',
  EDIT_MESSAGE: 'edit_message',
  MESSAGE_EDITED: 'message_edited',
  DELETE_MESSAGE: 'delete_message',
  MESSAGE_DELETED: 'message_deleted',
  MARK_MESSAGE_READ: 'mark_message_read',
  MESSAGE_READ: 'message_read',
  
  // Typing events
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  USER_TYPING: 'user_typing',
  USER_STOP_TYPING: 'user_stop_typing',
  
  // Reaction events
  ADD_REACTION: 'add_reaction',
  REMOVE_REACTION: 'remove_reaction',
  REACTION_UPDATED: 'reaction_updated',
  
  // Group events
  JOIN_GROUP: 'join_group',
  LEAVE_GROUP: 'leave_group',
  USER_JOINED_GROUP: 'user_joined_group',
  USER_LEFT_GROUP: 'user_left_group',
  
  // Error events
  ERROR: 'error',
  
  // Ping/Pong for connection health
  PING: 'ping',
  PONG: 'pong',
}

// UI Configuration
export const UI_CONFIG = {
  // Pagination
  MESSAGES_PER_PAGE: parseInt(import.meta.env.VITE_MESSAGES_PER_PAGE) || 50,
  CONVERSATIONS_PER_PAGE: 20,
  USERS_PER_PAGE: 10,
  
  // Timeouts
  TYPING_TIMEOUT: parseInt(import.meta.env.VITE_TYPING_TIMEOUT) || 3000,
  ONLINE_CHECK_INTERVAL: parseInt(import.meta.env.VITE_ONLINE_CHECK_INTERVAL) || 30000,
  NOTIFICATION_TIMEOUT: 5000,
  TOAST_TIMEOUT: 4000,
  
  // Socket configuration
  RECONNECT_ATTEMPTS: parseInt(import.meta.env.VITE_RECONNECT_ATTEMPTS) || 5,
  RECONNECT_INTERVAL: parseInt(import.meta.env.VITE_RECONNECT_INTERVAL) || 2000,
  
  // File upload
  MAX_FILE_SIZE: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 10485760, // 10MB
  ALLOWED_FILE_TYPES: import.meta.env.VITE_ALLOWED_FILE_TYPES || 'image/*,application/pdf,text/*',
  
  // Performance
  MESSAGE_CACHE_SIZE: parseInt(import.meta.env.VITE_MESSAGE_CACHE_SIZE) || 1000,
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 1000,
  
  // Theme
  DEFAULT_THEME: import.meta.env.VITE_DEFAULT_THEME || 'dark',
  ENABLE_THEME_SWITCHER: import.meta.env.VITE_ENABLE_THEME_SWITCHER === 'true',
}

// Feature Flags
export const FEATURES = {
  NOTIFICATIONS: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  FILE_UPLOAD: import.meta.env.VITE_ENABLE_FILE_UPLOAD === 'true',
  VOICE_MESSAGES: import.meta.env.VITE_ENABLE_VOICE_MESSAGES === 'true',
  VIDEO_CALLS: import.meta.env.VITE_ENABLE_VIDEO_CALLS === 'true',
  SCREEN_SHARING: import.meta.env.VITE_ENABLE_SCREEN_SHARING === 'true',
  LAZY_LOAD_IMAGES: import.meta.env.VITE_LAZY_LOAD_IMAGES === 'true',
  INFINITE_SCROLL: import.meta.env.VITE_INFINITE_SCROLL === 'true',
}

// Debug Configuration
export const DEBUG = {
  ENABLED: import.meta.env.VITE_DEBUG_MODE === 'true',
  SOCKET_LOGS: import.meta.env.VITE_SHOW_SOCKET_LOGS === 'true',
  API_LOGS: import.meta.env.VITE_SHOW_API_LOGS === 'true',
}

// User Status Constants
export const USER_STATUS = {
  ONLINE: 'online',
  AWAY: 'away',
  OFFLINE: 'offline',
}

// Message Types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system',
}

// Message Status
export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
}

// Conversation Types
export const CONVERSATION_TYPES = {
  DIRECT: 'direct',
  GROUP: 'group',
}

// Group Roles
export const GROUP_ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  MEMBER: 'member',
}

// Local Storage Keys
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
  USERNAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128,
  },
  EMAIL: {
    MAX_LENGTH: 255,
  },
  MESSAGE: {
    MAX_LENGTH: 2000,
  },
  GROUP_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  GROUP_DESCRIPTION: {
    MAX_LENGTH: 500,
  },
  BIO: {
    MAX_LENGTH: 250,
  },
  LOCATION: {
    MAX_LENGTH: 100,
  },
}

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  AUTHENTICATION_ERROR: 'Authentication failed. Please login again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_TOO_LARGE: `File size must be less than ${UI_CONFIG.MAX_FILE_SIZE / 1048576}MB`,
  UNSUPPORTED_FILE_TYPE: 'Unsupported file type',
  CONNECTION_LOST: 'Connection lost. Attempting to reconnect...',
  RECONNECTION_FAILED: 'Failed to reconnect. Please refresh the page.',
  MESSAGE_SEND_FAILED: 'Failed to send message. Please try again.',
  CONVERSATION_NOT_FOUND: 'Conversation not found',
  USER_NOT_FOUND: 'User not found',
  UNAUTHORIZED: 'You are not authorized to perform this action',
}

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in',
  REGISTER_SUCCESS: 'Account created successfully',
  MESSAGE_SENT: 'Message sent',
  MESSAGE_EDITED: 'Message edited',
  MESSAGE_DELETED: 'Message deleted',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  GROUP_CREATED: 'Group created successfully',
  PARTICIPANT_ADDED: 'Participant added to group',
  PARTICIPANT_REMOVED: 'Participant removed from group',
  CONVERSATION_ARCHIVED: 'Conversation archived',
  CONVERSATION_UNARCHIVED: 'Conversation unarchived',
}

// Emoji Reactions (commonly used)
export const EMOJI_REACTIONS = [
  '👍', '❤️', '😂', '😮', '😢', '😡',
  '🔥', '👏', '🎉', '💯', '🤔', '😍'
]

// Color Themes
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

// Animation Durations (in milliseconds)
export const ANIMATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  TYPING_INDICATOR: 1500,
  TOAST: 4000,
  MODAL: 200,
}

// Breakpoints (matching Tailwind CSS)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
}
