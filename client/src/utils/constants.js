/**
 * Application Constants
 * Centralized configuration and constants
 */

// =============================================================================
// API Configuration
// =============================================================================
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// API Endpoints
export const AUTH_ENDPOINTS = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  CHANGE_PASSWORD: '/auth/password',
  REFRESH_TOKEN: '/auth/refresh',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
};

export const CHAT_ENDPOINTS = {
  CONVERSATIONS: '/chat/conversations',
  MESSAGES: '/chat/conversations/:id/messages',
  SEND_MESSAGE: '/chat/messages',
  EDIT_MESSAGE: '/chat/messages/edit',
  DELETE_MESSAGE: '/chat/messages/:messageId',
  MARK_READ: '/chat/conversations/:id/read',
  REACTIONS: '/chat/messages/reactions',
  SEARCH_USERS: '/chat/users/search',
  DIRECT_CONVERSATION: '/chat/conversations/direct',
  GROUP_CONVERSATION: '/chat/conversations/group',
};

export const USER_ENDPOINTS = {
  PROFILE: '/users/me',           
  UPDATE_PROFILE: '/users/me',   
  UPLOAD_AVATAR: '/users/avatar',
  SEARCH: '/users/search',
  BLOCK: '/users/block',
  UNBLOCK: '/users/unblock',
};

// =============================================================================
// Storage Keys
// =============================================================================
export const STORAGE_KEYS = {
  TOKEN: 'connexus_token',
  USER: 'connexus_user',
  REFRESH_TOKEN: 'connexus_refresh_token',
  THEME: 'connexus_theme',
  LANGUAGE: 'connexus_language',
  CHAT_DRAFT: 'connexus_chat_draft_',
  LAST_SEEN: 'connexus_last_seen',
  NOTIFICATION_SETTINGS: 'connexus_notifications',
};

// =============================================================================
// User & Status Constants
// =============================================================================
export const USER_STATUS = {
  ONLINE: 'online',
  AWAY: 'away',
  OFFLINE: 'offline',
  BUSY: 'busy',
  INVISIBLE: 'invisible',
};

export const USER_ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  MEMBER: 'member',
  GUEST: 'guest',
};

// =============================================================================
// Message & Chat Constants
// =============================================================================
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system',
  VOICE: 'voice',
  VIDEO: 'video',
};

export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
};

export const CONVERSATION_TYPES = {
  DIRECT: 'direct',
  GROUP: 'group',
  CHANNEL: 'channel',
};

export const REACTION_EMOJIS = [
  '👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🙏',
  '🔥', '💯', '🎉', '👀', '🤔', '😍', '🙌', '💀'
];

// =============================================================================
// File & Upload Constants
// =============================================================================
export const FILE_TYPES = {
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  VIDEO: ['mp4', 'webm', 'ogg', 'avi', 'mov'],
  AUDIO: ['mp3', 'wav', 'ogg', 'aac', 'm4a'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
  ARCHIVE: ['zip', 'rar', '7z', 'tar', 'gz'],
};

export const FILE_SIZE_LIMITS = {
  AVATAR: 5 * 1024 * 1024, // 5MB
  IMAGE: 10 * 1024 * 1024, // 10MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  AUDIO: 25 * 1024 * 1024, // 25MB
  DOCUMENT: 50 * 1024 * 1024, // 50MB
  DEFAULT: 25 * 1024 * 1024, // 25MB
};

// =============================================================================
// UI & UX Constants
// =============================================================================
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  CHAT: '/chat',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  NOT_FOUND: '/404',
  WELCOME: '/welcome',
};

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
};

export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};

// =============================================================================
// Socket Events
// =============================================================================
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  
  // Authentication
  AUTHENTICATE: 'authenticate',
  AUTHENTICATED: 'authenticated',
  
  // Messages
  SEND_MESSAGE: 'send_message',
  NEW_MESSAGE: 'new_message',
  MESSAGE_SENT: 'message_sent',
  MESSAGE_EDITED: 'message_edited',
  MESSAGE_DELETED: 'message_deleted',
  MESSAGE_READ: 'message_read',
  
  // Reactions
  ADD_REACTION: 'add_reaction',
  REMOVE_REACTION: 'remove_reaction',
  REACTION_UPDATED: 'reaction_updated',
  
  // Typing
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  USER_TYPING: 'user_typing',
  USER_STOP_TYPING: 'user_stop_typing',
  
  // Presence
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  USER_STATUS_UPDATED: 'user_status_updated',
  CURRENT_ONLINE_USERS: 'current_online_users',
  
  // Conversations
  JOIN_CONVERSATION: 'join_conversation',
  LEAVE_CONVERSATION: 'leave_conversation',
  CONVERSATION_INFO: 'conversation_info',
  
  // Groups
  JOIN_GROUP: 'join_group',
  LEAVE_GROUP: 'leave_group',
  USER_JOINED_GROUP: 'user_joined_group',
  USER_LEFT_GROUP: 'user_left_group',
  
  // System
  ERROR: 'error',
  PING: 'ping',
  PONG: 'pong',
};

// =============================================================================
// Pagination & Limits
// =============================================================================
export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
  MIN_LIMIT: 10,
  MESSAGES_LIMIT: 50,
  USERS_LIMIT: 20,
  CONVERSATIONS_LIMIT: 100,
};

// =============================================================================
// Error Codes & Messages
// =============================================================================
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
};

export const ERROR_MESSAGES = {
  [ERROR_CODES.NETWORK_ERROR]: 'Network connection error. Please check your internet connection.',
  [ERROR_CODES.UNAUTHORIZED]: 'You are not authorized to perform this action.',
  [ERROR_CODES.FORBIDDEN]: 'Access denied. You do not have permission.',
  [ERROR_CODES.NOT_FOUND]: 'The requested resource was not found.',
  [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ERROR_CODES.SERVER_ERROR]: 'Server error. Please try again later.',
  [ERROR_CODES.TIMEOUT_ERROR]: 'Request timeout. Please try again.',
  DEFAULT: 'An unexpected error occurred. Please try again.',
};

// =============================================================================
// Feature Flags
// =============================================================================
export const FEATURE_FLAGS = {
  VOICE_MESSAGES: true,
  VIDEO_CALLS: false,
  FILE_SHARING: true,
  GROUP_CHATS: true,
  MESSAGE_REACTIONS: true,
  MESSAGE_EDITING: true,
  MESSAGE_FORWARDING: false,
  TYPING_INDICATORS: true,
  READ_RECEIPTS: true,
  NOTIFICATION_SOUNDS: true,
  DARK_MODE: true,
};

// =============================================================================
// App Metadata
// =============================================================================
export const APP_CONFIG = {
  NAME: 'Connexus',
  VERSION: '1.0.0',
  DESCRIPTION: 'Real-time chat application',
  AUTHOR: 'Connexus Team',
  SUPPORT_EMAIL: 'support@connexus.com',
  GITHUB_URL: 'https://github.com/connexus/chat',
  PRIVACY_URL: '/privacy',
  TERMS_URL: '/terms',
};

// =============================================================================
// Time & Date Constants
// =============================================================================
export const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
};

export const DATE_FORMATS = {
  SHORT: 'MMM d',
  MEDIUM: 'MMM d, yyyy',
  LONG: 'MMMM d, yyyy',
  TIME: 'HH:mm',
  TIME_12: 'h:mm a',
  DATETIME: 'MMM d, yyyy HH:mm',
  DATETIME_12: 'MMM d, yyyy h:mm a',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
};

// =============================================================================
// Environment Checks
// =============================================================================
export const ENV = {
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  IS_SSR: import.meta.env.SSR,
  NODE_ENV: import.meta.env.NODE_ENV,
  BASE_URL: import.meta.env.BASE_URL,
};

// =============================================================================
// Default Export
// =============================================================================
export default {
  API_URL,
  SOCKET_URL,
  AUTH_ENDPOINTS,
  CHAT_ENDPOINTS,
  USER_ENDPOINTS,
  STORAGE_KEYS,
  USER_STATUS,
  USER_ROLES,
  MESSAGE_TYPES,
  MESSAGE_STATUS,
  CONVERSATION_TYPES,
  REACTION_EMOJIS,
  FILE_TYPES,
  FILE_SIZE_LIMITS,
  ROUTES,
  THEMES,
  BREAKPOINTS,
  ANIMATION_DURATION,
  SOCKET_EVENTS,
  PAGINATION,
  ERROR_CODES,
  ERROR_MESSAGES,
  FEATURE_FLAGS,
  APP_CONFIG,
  TIME_CONSTANTS,
  DATE_FORMATS,
  ENV,
};
