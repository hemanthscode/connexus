/**
 * Generate a random ID string
 * @param {number} length - Length of the ID
 * @returns {string} Random ID
 */
export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function to limit function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit time in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Deep clone an object
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

/**
 * Check if an object is empty
 * @param {object} obj - Object to check
 * @returns {boolean} True if empty
 */
export const isEmpty = (obj) => {
  if (obj == null) return true
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0
  if (typeof obj === 'object') return Object.keys(obj).length === 0
  return false
}

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  if (!str || typeof str !== 'string') return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Format file size to human readable
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get file extension from filename
 * @param {string} filename - File name
 * @returns {string} File extension
 */
export const getFileExtension = (filename) => {
  if (!filename || typeof filename !== 'string') return ''
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase()
}

/**
 * Check if file type is allowed
 * @param {string} fileType - MIME type of file
 * @param {string} allowedTypes - Comma-separated allowed types
 * @returns {boolean} True if allowed
 */
export const isFileTypeAllowed = (fileType, allowedTypes) => {
  if (!fileType || !allowedTypes) return false
  const types = allowedTypes.split(',').map(type => type.trim())
  return types.some(type => {
    if (type.endsWith('/*')) {
      const baseType = type.slice(0, -2)
      return fileType.startsWith(baseType)
    }
    return fileType === type
  })
}

/**
 * Generate avatar URL from name initials
 * @param {string} name - User name
 * @param {string} bgColor - Background color (hex)
 * @returns {string} Avatar URL
 */
export const generateAvatarUrl = (name, bgColor = '0ea5e9') => {
  if (!name) return ''
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
  return `https://ui-avatars.com/api/?name=${initials}&background=${bgColor}&color=fff&size=200&rounded=true&bold=true`
}

/**
 * Check if user is online based on last seen
 * @param {string|Date} lastSeen - Last seen timestamp
 * @param {number} threshold - Online threshold in minutes
 * @returns {boolean} True if online
 */
export const isUserOnline = (lastSeen, threshold = 5) => {
  if (!lastSeen) return false
  const now = new Date()
  const lastSeenDate = new Date(lastSeen)
  const diffInMinutes = (now - lastSeenDate) / (1000 * 60)
  return diffInMinutes <= threshold
}

/**
 * Scroll element to bottom smoothly
 * @param {HTMLElement} element - Element to scroll
 * @param {boolean} smooth - Whether to use smooth scrolling
 */
export const scrollToBottom = (element, smooth = true) => {
  if (!element) return
  element.scrollTo({
    top: element.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto'
  })
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text) => {
  if (!text) return false
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const result = document.execCommand('copy')
      document.body.removeChild(textArea)
      return result
    }
  } catch (error) {
    console.error('Failed to copy text:', error)
    return false
  }
}

/**
 * Check if device is mobile
 * @returns {boolean} True if mobile device
 */
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * Check if device supports touch
 * @returns {boolean} True if touch supported
 */
export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * Get contrast color (black or white) for background
 * @param {string} hexColor - Hex color code
 * @returns {string} Contrast color
 */
export const getContrastColor = (hexColor) => {
  if (!hexColor) return '#000000'
  const color = hexColor.replace('#', '')
  const r = parseInt(color.substr(0, 2), 16)
  const g = parseInt(color.substr(2, 2), 16)
  const b = parseInt(color.substr(4, 2), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

/**
 * Parse error message from various error formats
 * @param {any} error - Error object or message
 * @returns {string} Parsed error message
 */
export const parseErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred'
  
  if (typeof error === 'string') return error
  
  if (error.response?.data?.message) return error.response.data.message
  if (error.response?.data?.error) return error.response.data.error
  if (error.message) return error.message
  if (error.error) return error.error
  
  return 'An unexpected error occurred'
}

/**
 * Create URL-safe slug from text
 * @param {string} text - Text to slugify
 * @returns {string} URL-safe slug
 */
export const createSlug = (text) => {
  if (!text) return ''
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Check if string is valid JSON
 * @param {string} str - String to check
 * @returns {boolean} True if valid JSON
 */
export const isValidJSON = (str) => {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

/**
 * Retry async function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} delay - Initial delay in milliseconds
 * @returns {Promise} Result of function or error
 */
export const retryWithBackoff = async (fn, maxRetries = 3, delay = 1000) => {
  try {
    return await fn()
  } catch (error) {
    if (maxRetries <= 0) throw error
    await new Promise(resolve => setTimeout(resolve, delay))
    return retryWithBackoff(fn, maxRetries - 1, delay * 2)
  }
}

/**
 * Create a promise that resolves after specified time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after delay
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Clamp number between min and max values
 * @param {number} number - Number to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped number
 */
export const clamp = (number, min, max) => Math.min(Math.max(number, min), max)

/**
 * Generate random number between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number
 */
export const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

/**
 * Remove duplicates from array based on property
 * @param {Array} array - Array to deduplicate
 * @param {string} key - Property key to check for duplicates
 * @returns {Array} Deduplicated array
 */
export const removeDuplicates = (array, key) => {
  if (!Array.isArray(array)) return []
  if (!key) return [...new Set(array)]
  
  const seen = new Set()
  return array.filter(item => {
    const value = item[key]
    if (seen.has(value)) return false
    seen.add(value)
    return true
  })
}
