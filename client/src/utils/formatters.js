/**
 * Utility Formatting Functions - OPTIMIZED & FIXED
 * Consolidated formatters with reduced redundancy
 */

import { TIME } from './constants.js';

// =============================================================================
// Text Formatting - ENHANCED
// =============================================================================

/**
 * Get initials from a name - ENHANCED
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
 * Text truncation with smart word boundaries
 */
export const truncateText = (text, maxLength = 50, suffix = '...') => {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  
  // Try to break at word boundary
  const truncated = text.slice(0, maxLength - suffix.length);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.6) {
    return truncated.slice(0, lastSpace).trim() + suffix;
  }
  
  return truncated.trim() + suffix;
};

/**
 * Smart capitalization helpers - CONSOLIDATED
 */
export const textTransformers = {
  capitalizeWords: (text) => {
    if (!text || typeof text !== 'string') return '';
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  capitalizeFirst: (text) => {
    if (!text || typeof text !== 'string') return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  slugify: (text) => {
    if (!text || typeof text !== 'string') return '';
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
};

/**
 * Enhanced text parsing and extraction
 */
export const textParsers = {
  extractMentions: (text) => {
    if (!text || typeof text !== 'string') return [];
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return [...new Set(mentions)];
  },

  extractUrls: (text) => {
    if (!text || typeof text !== 'string') return [];
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    const urls = text.match(urlRegex);
    return urls ? [...new Set(urls)] : [];
  },

  extractHashtags: (text) => {
    if (!text || typeof text !== 'string') return [];
    const hashtagRegex = /#(\w+)/g;
    const hashtags = [];
    let match;
    while ((match = hashtagRegex.exec(text)) !== null) {
      hashtags.push(match[1]);
    }
    return [...new Set(hashtags)];
  }
};

/**
 * Text highlighting with multiple terms support
 */
export const highlightSearchTerms = (text, searchTerms, className = 'highlight') => {
  if (!text || !searchTerms) return text;
  
  const terms = Array.isArray(searchTerms) ? searchTerms : [searchTerms];
  const escapedTerms = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
  
  return text.replace(regex, `<span class="${className}">$1</span>`);
};

// =============================================================================
// Number Formatting - ENHANCED
// =============================================================================

/**
 * File size formatting with better precision
 */
export const formatFileSize = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  return `${value} ${sizes[i]}`;
};

/**
 * Number formatting utilities - CONSOLIDATED
 */
export const numberFormatters = {
  withCommas: (num) => {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat().format(num);
  },

  compact: (num) => {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat('en', { 
      notation: 'compact',
      maximumFractionDigits: 1 
    }).format(num);
  },

  percentage: (value, total = 100, decimals = 1) => {
    if (value === null || value === undefined || total === 0) return '0%';
    const percentage = (value / total) * 100;
    return percentage.toFixed(decimals) + '%';
  },

  currency: (amount, currency = 'USD') => {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  ordinal: (num) => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  }
};

// =============================================================================
// Date & Time Formatting - ENHANCED
// =============================================================================

/**
 * Enhanced relative time formatting
 */
export const formatRelativeTime = (date, options = {}) => {
  if (!date) return '';
  
  const now = new Date();
  const targetDate = new Date(date);
  const diffInMs = now - targetDate;
  const { showFuture = true, shortForm = false } = options;
  
  // Future dates
  if (diffInMs < 0) {
    if (!showFuture) return 'Future';
    
    const absDiff = Math.abs(diffInMs);
    const units = [
      { limit: TIME.CONSTANTS.MINUTE, label: shortForm ? 's' : 'seconds', divisor: TIME.CONSTANTS.SECOND },
      { limit: TIME.CONSTANTS.HOUR, label: shortForm ? 'm' : 'minutes', divisor: TIME.CONSTANTS.MINUTE },
      { limit: TIME.CONSTANTS.DAY, label: shortForm ? 'h' : 'hours', divisor: TIME.CONSTANTS.HOUR },
      { limit: Infinity, label: shortForm ? 'd' : 'days', divisor: TIME.CONSTANTS.DAY }
    ];
    
    for (const unit of units) {
      if (absDiff < unit.limit) {
        const value = Math.floor(absDiff / unit.divisor);
        return shortForm ? `${value}${unit.label}` : `in ${value} ${unit.label}`;
      }
    }
  }
  
  // Past times
  const units = [
    { limit: TIME.CONSTANTS.MINUTE, label: shortForm ? 'now' : 'just now' },
    { limit: TIME.CONSTANTS.HOUR, label: shortForm ? 'm' : 'minutes ago', divisor: TIME.CONSTANTS.MINUTE },
    { limit: TIME.CONSTANTS.DAY, label: shortForm ? 'h' : 'hours ago', divisor: TIME.CONSTANTS.HOUR },
    { limit: TIME.CONSTANTS.WEEK, label: shortForm ? 'd' : 'days ago', divisor: TIME.CONSTANTS.DAY },
    { limit: TIME.CONSTANTS.MONTH, label: shortForm ? 'w' : 'weeks ago', divisor: TIME.CONSTANTS.WEEK },
    { limit: TIME.CONSTANTS.YEAR, label: shortForm ? 'mo' : 'months ago', divisor: TIME.CONSTANTS.MONTH },
    { limit: Infinity, label: shortForm ? 'y' : 'years ago', divisor: TIME.CONSTANTS.YEAR }
  ];
  
  for (const unit of units) {
    if (diffInMs < unit.limit) {
      if (!unit.divisor) return unit.label;
      const value = Math.floor(diffInMs / unit.divisor);
      return shortForm ? `${value}${unit.label}` : `${value} ${unit.label}`;
    }
  }
};

/**
 * Smart chat time formatting
 */
export const formatChatTime = (date, options = {}) => {
  if (!date) return '';
  
  const now = new Date();
  const targetDate = new Date(date);
  const { showSeconds = false, use24Hour = false } = options;
  
  // Same day - show time only
  if (now.toDateString() === targetDate.toDateString()) {
    return targetDate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      ...(showSeconds && { second: '2-digit' }),
      hour12: !use24Hour
    });
  }
  
  // This week - show day and time
  const diffInMs = now - targetDate;
  if (diffInMs < TIME.CONSTANTS.WEEK) {
    return targetDate.toLocaleDateString([], { 
      weekday: 'short', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: !use24Hour
    });
  }
  
  // This year - show date without year
  if (now.getFullYear() === targetDate.getFullYear()) {
    return targetDate.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: !use24Hour
    });
  }
  
  // Different year - show full date
  return targetDate.toLocaleDateString([], { 
    year: 'numeric',
    month: 'short', 
    day: 'numeric' 
  });
};

/**
 * Enhanced date utilities
 */
export const dateUtils = {
  formatDuration: (seconds) => {
    if (!seconds || seconds < 0) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  isToday: (date) => {
    if (!date) return false;
    const today = new Date();
    const targetDate = new Date(date);
    return today.toDateString() === targetDate.toDateString();
  },

  isYesterday: (date) => {
    if (!date) return false;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const targetDate = new Date(date);
    return yesterday.toDateString() === targetDate.toDateString();
  },

  isThisWeek: (date) => {
    if (!date) return false;
    const now = new Date();
    const targetDate = new Date(date);
    return (now - targetDate) < TIME.CONSTANTS.WEEK;
  },

  getTimeAgo: (date, short = false) => {
    return formatRelativeTime(date, { shortForm: short });
  }
};

// =============================================================================
// URL & Link Formatting - ENHANCED
// =============================================================================

/**
 * Advanced URL utilities
 */
export const urlUtils = {
  linkifyText: (text, options = {}) => {
    if (!text || typeof text !== 'string') return '';
    
    const { target = '_blank', className = 'text-link', truncate = false, maxLength = 30 } = options;
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    
    return text.replace(urlRegex, (url) => {
      const displayUrl = truncate && url.length > maxLength ? 
        url.substring(0, maxLength) + '...' : url;
      
      return `<a href="${url}" target="${target}" rel="noopener noreferrer" class="${className}">${displayUrl}</a>`;
    });
  },

  getDomainFromUrl: (url) => {
    if (!url || typeof url !== 'string') return '';
    
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return '';
    }
  },

  isValidUrl: (url) => {
    if (!url || typeof url !== 'string') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  extractDomain: (email) => {
    if (!email || typeof email !== 'string') return '';
    const domain = email.split('@')[1];
    return domain || '';
  }
};

// =============================================================================
// Error Formatting - ENHANCED
// =============================================================================

/**
 * Enhanced error formatting with context
 */
export const formatError = (error, context = null) => {
  if (!error) return 'An unexpected error occurred';
  
  // String error
  if (typeof error === 'string') return error;
  
  // API error with detailed response
  if (error.response?.data) {
    const data = error.response.data;
    if (data.message) return data.message;
    if (data.error) return data.error;
    if (data.details) return data.details;
  }
  
  // HTTP status errors
  if (error.response?.status) {
    const status = error.response.status;
    const statusMessages = {
      400: 'Bad request. Please check your input.',
      401: 'Authentication required. Please log in.',
      403: 'Access denied. You do not have permission.',
      404: 'Resource not found.',
      408: 'Request timeout. Please try again.',
      409: 'Conflict. Resource already exists.',
      422: 'Validation failed. Please check your input.',
      429: 'Too many requests. Please wait and try again.',
      500: 'Internal server error. Please try again later.',
      502: 'Bad gateway. Service temporarily unavailable.',
      503: 'Service unavailable. Please try again later.',
      504: 'Gateway timeout. Please try again.',
    };
    
    if (statusMessages[status]) {
      return context ? `${context}: ${statusMessages[status]}` : statusMessages[status];
    }
  }
  
  // Standard error object
  if (error.message) return error.message;
  
  // Network and timeout errors
  const networkErrors = {
    'NETWORK_ERROR': 'Network connection error. Please check your internet connection.',
    'NetworkError': 'Network connection error. Please check your internet connection.',
    'ECONNABORTED': 'Request timeout. Please try again.',
    'ENOTFOUND': 'Server not found. Please check your connection.',
    'ECONNREFUSED': 'Connection refused. Server may be down.',
  };
  
  if (error.code && networkErrors[error.code]) {
    return networkErrors[error.code];
  }
  
  if (error.name && networkErrors[error.name]) {
    return networkErrors[error.name];
  }
  
  if (error.message?.includes('timeout')) {
    return 'Request timeout. Please try again.';
  }
  
  return context ? `${context}: An unexpected error occurred` : 'An unexpected error occurred';
};

/**
 * Get error severity level
 */
export const getErrorSeverity = (error) => {
  if (!error) return 'low';
  
  const status = error.response?.status || error.status;
  
  if (status >= 500) return 'critical';
  if (status >= 400) return 'high';
  if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') return 'medium';
  if (error.message?.includes('timeout')) return 'medium';
  
  return 'low';
};

// =============================================================================
// Color & Theme Utilities - ENHANCED
// =============================================================================

/**
 * Enhanced color generation with better distribution
 */
export const generateColorFromString = (str, options = {}) => {
  if (!str || typeof str !== 'string') return '#6B7280';
  
  const { saturation = 65, lightness = 50, alpha = 1 } = options;
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  const sat = saturation + (Math.abs(hash) % 35); // 65-100%
  const light = lightness + (Math.abs(hash) % 25); // 50-75%
  
  if (alpha < 1) {
    return `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
  }
  
  return `hsl(${hue}, ${sat}%, ${light}%)`;
};

/**
 * Color utilities
 */
export const colorUtils = {
  isColorDark: (color) => {
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
  },

  getContrastColor: (backgroundColor) => {
    return colorUtils.isColorDark(backgroundColor) ? '#ffffff' : '#000000';
  },

  hexToHsl: (hex) => {
    if (!hex) return null;
    
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      
      h /= 6;
    }
    
    return { h: h * 360, s: s * 100, l: l * 100 };
  }
};

// =============================================================================
// Default Export - FIXED (no duplicates)
// =============================================================================
export default {
  // Text utilities
  getInitials,
  truncateText,
  highlightSearchTerms,
  textTransformers,
  textParsers,
  
  // Number utilities
  formatFileSize,
  numberFormatters,
  
  // Date utilities
  formatRelativeTime,
  formatChatTime,
  dateUtils,
  
  // URL utilities
  urlUtils,
  
  // Error utilities
  formatError,
  getErrorSeverity,
  
  // Color utilities
  generateColorFromString,
  colorUtils,
};
