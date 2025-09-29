// ID and Random Generation
export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('')
}

export const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
export const clamp = (number, min, max) => Math.min(Math.max(number, min), max)

// Function Utilities
export const debounce = (func, wait) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export const throttle = (func, limit) => {
  let inThrottle
  return (...args) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries) throw error
      await delay(baseDelay * Math.pow(2, attempt))
    }
  }
}

// Object and Array Utilities
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (Array.isArray(obj)) return obj.map(deepClone)
  
  const cloned = {}
  Object.keys(obj).forEach(key => {
    cloned[key] = deepClone(obj[key])
  })
  return cloned
}

export const isEmpty = (value) => {
  if (value == null) return true
  if (Array.isArray(value) || typeof value === 'string') return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

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

// String Utilities
export const capitalize = (str) => {
  if (!str || typeof str !== 'string') return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

export const createSlug = (text) => {
  if (!text) return ''
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const parseErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred'
  if (typeof error === 'string') return error
  if (error.response?.data?.message) return error.response.data.message
  if (error.response?.data?.error) return error.response.data.error
  if (error.message) return error.message
  return 'An unexpected error occurred'
}

// File Utilities
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`
}

export const getFileExtension = (filename) => {
  if (!filename || typeof filename !== 'string') return ''
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase()
}

export const isFileTypeAllowed = (fileType, allowedTypes) => {
  if (!fileType || !allowedTypes) return false
  const types = allowedTypes.split(',').map(type => type.trim())
  return types.some(type => 
    type.endsWith('/*') ? fileType.startsWith(type.slice(0, -2)) : fileType === type
  )
}

// User and Avatar Utilities
export const generateAvatarUrl = (name, bgColor = '0ea5e9', size = 200) => {
  if (!name) return ''
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
  return `https://ui-avatars.com/api/?name=${initials}&background=${bgColor}&color=fff&size=${size}&rounded=true&bold=true`
}

export const isUserOnline = (lastSeen, thresholdMinutes = 5) => {
  if (!lastSeen) return false
  const diffInMinutes = (new Date() - new Date(lastSeen)) / (1000 * 60)
  return diffInMinutes <= thresholdMinutes
}

// DOM and Browser Utilities
export const scrollToBottom = (element, smooth = true) => {
  if (!element) return
  element.scrollTo({
    top: element.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto'
  })
}

export const copyToClipboard = async (text) => {
  if (!text) return false
  
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    Object.assign(textArea.style, {
      position: 'fixed',
      left: '-999999px',
      top: '-999999px'
    })
    
    document.body.appendChild(textArea)
    textArea.select()
    const result = document.execCommand('copy')
    document.body.removeChild(textArea)
    return result
  } catch (error) {
    console.error('Failed to copy text:', error)
    return false
  }
}

// Device Detection
export const isMobile = () => 
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

export const isTouchDevice = () => 
  'ontouchstart' in window || navigator.maxTouchPoints > 0

// Color Utilities
export const getContrastColor = (hexColor) => {
  if (!hexColor) return '#000000'
  const color = hexColor.replace('#', '')
  const r = parseInt(color.substr(0, 2), 16)
  const g = parseInt(color.substr(2, 2), 16)  
  const b = parseInt(color.substr(4, 2), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

// Validation Utilities
export const isValidJSON = (str) => {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidUrl = (url) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
