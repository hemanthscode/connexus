/**
 * Simple XOR encryption for non-sensitive data
 * @param {string} text - Text to encrypt/decrypt
 * @param {string} key - Encryption key
 * @returns {string} Encrypted/decrypted text
 */
const xorEncrypt = (text, key) => {
  if (!text || !key) return text
  
  let result = ''
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    )
  }
  return result
}

/**
 * Base64 encode string
 * @param {string} str - String to encode
 * @returns {string} Base64 encoded string
 */
export const encodeBase64 = (str) => {
  if (!str) return ''
  try {
    return btoa(unescape(encodeURIComponent(str)))
  } catch (error) {
    console.warn('Failed to encode base64:', error)
    return str
  }
}

/**
 * Base64 decode string
 * @param {string} str - Base64 string to decode
 * @returns {string} Decoded string
 */
export const decodeBase64 = (str) => {
  if (!str) return ''
  try {
    return decodeURIComponent(escape(atob(str)))
  } catch (error) {
    console.warn('Failed to decode base64:', error)
    return str
  }
}

/**
 * Generate simple encryption key from user data
 * @param {string} userId - User ID
 * @param {string} timestamp - Timestamp string
 * @returns {string} Generated key
 */
export const generateEncryptionKey = (userId, timestamp = Date.now().toString()) => {
  if (!userId) return 'defaultkey'
  
  const combined = `${userId}_${timestamp}`
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Encrypt sensitive localStorage data
 * @param {any} data - Data to encrypt
 * @param {string} key - Encryption key
 * @returns {string} Encrypted data
 */
export const encryptLocalStorageData = (data, key = 'connexus_key') => {
  if (!data) return ''
  
  try {
    const jsonString = JSON.stringify(data)
    const encrypted = xorEncrypt(jsonString, key)
    return encodeBase64(encrypted)
  } catch (error) {
    console.warn('Failed to encrypt data:', error)
    return JSON.stringify(data)
  }
}

/**
 * Decrypt localStorage data
 * @param {string} encryptedData - Encrypted data string
 * @param {string} key - Decryption key
 * @returns {any} Decrypted data
 */
export const decryptLocalStorageData = (encryptedData, key = 'connexus_key') => {
  if (!encryptedData) return null
  
  try {
    const decoded = decodeBase64(encryptedData)
    const decrypted = xorEncrypt(decoded, key)
    return JSON.parse(decrypted)
  } catch (error) {
    console.warn('Failed to decrypt data, trying fallback:', error)
    try {
      return JSON.parse(encryptedData)
    } catch (fallbackError) {
      console.warn('Fallback parse failed:', fallbackError)
      return null
    }
  }
}

/**
 * Hash string using simple algorithm (not cryptographically secure)
 * @param {string} str - String to hash
 * @returns {string} Hash string
 */
export const simpleHash = (str) => {
  if (!str) return ''
  
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Generate random token
 * @param {number} length - Token length
 * @returns {string} Random token
 */
export const generateRandomToken = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return token
}

/**
 * Obfuscate email for display
 * @param {string} email - Email to obfuscate
 * @returns {string} Obfuscated email
 */
export const obfuscateEmail = (email) => {
  if (!email || typeof email !== 'string' || !email.includes('@')) return email
  
  const [username, domain] = email.split('@')
  if (username.length <= 3) return email
  
  const visibleStart = username.slice(0, 2)
  const visibleEnd = username.slice(-1)
  const stars = '*'.repeat(Math.max(1, username.length - 3))
  
  return `${visibleStart}${stars}${visibleEnd}@${domain}`
}

/**
 * Obfuscate phone number for display
 * @param {string} phone - Phone number to obfuscate
 * @returns {string} Obfuscated phone
 */
export const obfuscatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return phone
  
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length < 6) return phone
  
  const visibleStart = cleaned.slice(0, 2)
  const visibleEnd = cleaned.slice(-2)
  const stars = '*'.repeat(Math.max(2, cleaned.length - 4))
  
  return `${visibleStart}${stars}${visibleEnd}`
}

/**
 * Secure random number generator (for non-cryptographic use)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number
 */
export const secureRandom = (min = 0, max = 1) => {
  if (window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1)
    window.crypto.getRandomValues(array)
    return min + (array[0] / (0xFFFFFFFF + 1)) * (max - min)
  }
  
  // Fallback to Math.random
  return min + Math.random() * (max - min)
}

/**
 * Generate UUID v4 (not cryptographically secure)
 * @returns {string} UUID string
 */
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Encrypt draft message for temporary storage
 * @param {string} message - Draft message
 * @param {string} conversationId - Conversation ID
 * @returns {string} Encrypted draft
 */
export const encryptDraftMessage = (message, conversationId) => {
  if (!message || !conversationId) return ''
  
  const key = simpleHash(conversationId)
  return encryptLocalStorageData({ message, timestamp: Date.now() }, key)
}

/**
 * Decrypt draft message
 * @param {string} encryptedDraft - Encrypted draft
 * @param {string} conversationId - Conversation ID
 * @returns {object|null} Decrypted draft with message and timestamp
 */
export const decryptDraftMessage = (encryptedDraft, conversationId) => {
  if (!encryptedDraft || !conversationId) return null
  
  const key = simpleHash(conversationId)
  const decrypted = decryptLocalStorageData(encryptedDraft, key)
  
  // Check if draft is not too old (24 hours)
  if (decrypted && decrypted.timestamp) {
    const age = Date.now() - decrypted.timestamp
    if (age > 24 * 60 * 60 * 1000) return null
  }
  
  return decrypted
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
export const sanitizeHTML = (html) => {
  if (!html || typeof html !== 'string') return ''
  
  // Create a temporary div to parse HTML
  const temp = document.createElement('div')
  temp.textContent = html
  return temp.innerHTML
}

/**
 * Escape special characters for safe display
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export const escapeHtml = (str) => {
  if (!str || typeof str !== 'string') return ''
  
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

/**
 * Generate device fingerprint (basic)
 * @returns {string} Device fingerprint
 */
export const generateDeviceFingerprint = () => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.textBaseline = 'top'
  ctx.font = '14px Arial'
  ctx.fillText('Device fingerprint', 2, 2)
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
  ].join('|')
  
  return simpleHash(fingerprint)
}
