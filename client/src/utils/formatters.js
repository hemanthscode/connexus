/**
 * Utility Formatting Functions
 * Centralized formatting helpers
 */

import { TIME_CONSTANTS, DATE_FORMATS } from './constants.js';

// =============================================================================
// Text Formatting
// =============================================================================

/**
 * Get initials from a name
 * @param {string} name - Full name
 * @param {number} maxInitials - Maximum number of initials (default: 2)
 * @returns {string} Formatted initials
 */
export const getInitials = (name, maxInitials = 2) => {
  if (!name || typeof name !== 'string') return '??';
  
  return name
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, maxInitials);
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length (default: 50)
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50, suffix = '...') => {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength - suffix.length).trim() + suffix;
};

/**
 * Capitalize first letter of each word
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 */
export const capitalizeWords = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Capitalize first letter only
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 */
export const capitalizeFirst = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Convert text to slug format
 * @param {string} text - Text to convert
 * @returns {string} Slug format text
 */
export const slugify = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Extract mentions from text
 * @param {string} text - Text to extract mentions from
 * @returns {Array} Array of mentions
 */
export const extractMentions = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  return [...new Set(mentions)]; // Remove duplicates
};

/**
 * Highlight search terms in text
 * @param {string} text - Text to highlight
 * @param {string} searchTerm - Term to highlight
 * @param {string} className - CSS class for highlight
 * @returns {string} HTML string with highlights
 */
export const highlightSearchTerms = (text, searchTerm, className = 'highlight') => {
  if (!text || !searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, `<span class="${className}">$1</span>`);
};

// =============================================================================
// Number Formatting
// =============================================================================

/**
 * Format file size in human readable format
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  
  return new Intl.NumberFormat().format(num);
};

/**
 * Format number in compact form (1.2K, 1.2M, etc.)
 * @param {number} num - Number to format
 * @returns {string} Compact formatted number
 */
export const formatCompactNumber = (num) => {
  if (num === null || num === undefined) return '0';
  
  return new Intl.NumberFormat('en', { 
    notation: 'compact',
    maximumFractionDigits: 1 
  }).format(num);
};

/**
 * Format percentage
 * @param {number} value - Value to format as percentage
 * @param {number} total - Total value (default: 100)
 * @param {number} decimals - Decimal places (default: 1)
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, total = 100, decimals = 1) => {
  if (value === null || value === undefined || total === 0) return '0%';
  
  const percentage = (value / total) * 100;
  return percentage.toFixed(decimals) + '%';
};

// =============================================================================
// Date & Time Formatting
// =============================================================================

/**
 * Format date relative to now (e.g., "2 hours ago")
 * @param {Date|string|number} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const targetDate = new Date(date);
  const diffInMs = now - targetDate;
  
  // If in the future, return "in X time"
  if (diffInMs < 0) {
    const absDiff = Math.abs(diffInMs);
    if (absDiff < TIME_CONSTANTS.MINUTE) return 'in a few seconds';
    if (absDiff < TIME_CONSTANTS.HOUR) return `in ${Math.floor(absDiff / TIME_CONSTANTS.MINUTE)} minutes`;
    if (absDiff < TIME_CONSTANTS.DAY) return `in ${Math.floor(absDiff / TIME_CONSTANTS.HOUR)} hours`;
    return `in ${Math.floor(absDiff / TIME_CONSTANTS.DAY)} days`;
  }
  
  // Past times
  if (diffInMs < TIME_CONSTANTS.MINUTE) return 'just now';
  if (diffInMs < TIME_CONSTANTS.HOUR) return `${Math.floor(diffInMs / TIME_CONSTANTS.MINUTE)} minutes ago`;
  if (diffInMs < TIME_CONSTANTS.DAY) return `${Math.floor(diffInMs / TIME_CONSTANTS.HOUR)} hours ago`;
  if (diffInMs < TIME_CONSTANTS.WEEK) return `${Math.floor(diffInMs / TIME_CONSTANTS.DAY)} days ago`;
  if (diffInMs < TIME_CONSTANTS.MONTH) return `${Math.floor(diffInMs / TIME_CONSTANTS.WEEK)} weeks ago`;
  if (diffInMs < TIME_CONSTANTS.YEAR) return `${Math.floor(diffInMs / TIME_CONSTANTS.MONTH)} months ago`;
  
  return `${Math.floor(diffInMs / TIME_CONSTANTS.YEAR)} years ago`;
};

/**
 * Format chat message timestamp
 * @param {Date|string|number} date - Date to format
 * @returns {string} Chat-friendly time format
 */
export const formatChatTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const targetDate = new Date(date);
  const diffInMs = now - targetDate;
  
  // Same day - show time only
  if (diffInMs < TIME_CONSTANTS.DAY && now.toDateString() === targetDate.toDateString()) {
    return targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // This week - show day and time
  if (diffInMs < TIME_CONSTANTS.WEEK) {
    return targetDate.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  }
  
  // Older - show date
  return targetDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

/**
 * Format duration in minutes and seconds
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Check if date is today
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  if (!date) return false;
  
  const today = new Date();
  const targetDate = new Date(date);
  
  return today.toDateString() === targetDate.toDateString();
};

/**
 * Check if date is yesterday
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} True if date is yesterday
 */
export const isYesterday = (date) => {
  if (!date) return false;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const targetDate = new Date(date);
  
  return yesterday.toDateString() === targetDate.toDateString();
};

// =============================================================================
// URL & Link Formatting
// =============================================================================

/**
 * Extract URLs from text
 * @param {string} text - Text to extract URLs from
 * @returns {Array} Array of URLs
 */
export const extractUrls = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
  const urls = text.match(urlRegex);
  
  return urls ? [...new Set(urls)] : [];
};

/**
 * Convert URLs in text to clickable links
 * @param {string} text - Text to process
 * @param {string} target - Link target (default: '_blank')
 * @returns {string} HTML string with clickable links
 */
export const linkifyText = (text, target = '_blank') => {
  if (!text || typeof text !== 'string') return '';
  
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
  
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="${target}" rel="noopener noreferrer" class="text-link">${url}</a>`;
  });
};

/**
 * Get domain from URL
 * @param {string} url - URL to extract domain from
 * @returns {string} Domain name
 */
export const getDomainFromUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return '';
  }
};

// =============================================================================
// Error Formatting
// =============================================================================

/**
 * Format error for user display
 * @param {Error|Object|string} error - Error to format
 * @returns {string} User-friendly error message
 */
export const formatError = (error) => {
  if (!error) return 'An unexpected error occurred';
  
  // String error
  if (typeof error === 'string') return error;
  
  // API error with response
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // API error with status text
  if (error.response?.statusText) {
    return error.response.statusText;
  }
  
  // Standard error object
  if (error.message) {
    return error.message;
  }
  
  // Network errors
  if (error.code === 'NETWORK_ERROR' || error.name === 'NetworkError') {
    return 'Network connection error. Please check your internet connection.';
  }
  
  // Timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'Request timeout. Please try again.';
  }
  
  return 'An unexpected error occurred';
};

/**
 * Get error severity level
 * @param {Error|Object} error - Error to analyze
 * @returns {string} Severity level ('low', 'medium', 'high', 'critical')
 */
export const getErrorSeverity = (error) => {
  if (!error) return 'low';
  
  const status = error.response?.status || error.status;
  
  if (status >= 500) return 'critical';
  if (status >= 400) return 'high';
  if (error.name === 'NetworkError') return 'medium';
  
  return 'low';
};

// =============================================================================
// Color & Theme Utilities
// =============================================================================

/**
 * Generate consistent color from string (for avatars, etc.)
 * @param {string} str - String to generate color from
 * @returns {string} Hex color code
 */
export const generateColorFromString = (str) => {
  if (!str || typeof str !== 'string') return '#6B7280';
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  const saturation = 65 + (Math.abs(hash) % 35); // 65-100%
  const lightness = 45 + (Math.abs(hash) % 25); // 45-70%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

/**
 * Check if color is dark
 * @param {string} color - Color to check (hex, rgb, hsl)
 * @returns {boolean} True if color is dark
 */
export const isColorDark = (color) => {
  if (!color || typeof color !== 'string') return false;
  
  // Convert hex to RGB
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  }
  
  return false;
};

// =============================================================================
// Export All Functions
// =============================================================================
export default {
  // Text formatting
  getInitials,
  truncateText,
  capitalizeWords,
  capitalizeFirst,
  slugify,
  extractMentions,
  highlightSearchTerms,
  
  // Number formatting
  formatFileSize,
  formatNumber,
  formatCompactNumber,
  formatPercentage,
  
  // Date & time formatting
  formatRelativeTime,
  formatChatTime,
  formatDuration,
  isToday,
  isYesterday,
  
  // URL & link formatting
  extractUrls,
  linkifyText,
  getDomainFromUrl,
  
  // Error formatting
  formatError,
  getErrorSeverity,
  
  // Color utilities
  generateColorFromString,
  isColorDark,
};
