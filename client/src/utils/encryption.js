// Simple XOR encryption for non-sensitive data
const xorEncrypt = (text, key) => {
  if (!text || !key) return text
  
  let result = ''
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return result
}

// Base64 utilities with error handling
export const encodeBase64 = (str) => {
  if (!str) return ''
  try {
    return btoa(unescape(encodeURIComponent(str)))
  } catch (error) {
    console.warn('Base64 encode failed:', error)
    return str
  }
}

export const decodeBase64 = (str) => {
  if (!str) return ''
  try {
    return decodeURIComponent(escape(atob(str)))
  } catch (error) {
    console.warn('Base64 decode failed:', error)
    return str
  }
}

// Key generation
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

// Simple hash function
export const simpleHash = (str) => {
  if (!str) return ''
  
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

// LocalStorage encryption/decryption
export const encryptLocalStorageData = (data, key = 'connexus_key') => {
  if (!data) return ''
  
  try {
    const jsonString = JSON.stringify(data)
    const encrypted = xorEncrypt(jsonString, key)
    return encodeBase64(encrypted)
  } catch (error) {
    console.warn('Encryption failed, storing as plain JSON:', error)
    return JSON.stringify(data)
  }
}

export const decryptLocalStorageData = (encryptedData, key = 'connexus_key') => {
  if (!encryptedData) return null
  
  try {
    // Try to decrypt
    const decoded = decodeBase64(encryptedData)
    const decrypted = xorEncrypt(decoded, key)
    return JSON.parse(decrypted)
  } catch (error) {
    // Fallback to plain JSON parse
    try {
      return JSON.parse(encryptedData)
    } catch (fallbackError) {
      console.warn('Data decryption and fallback failed:', fallbackError)
      return null
    }
  }
}

// Draft message encryption (with expiry)
export const encryptDraftMessage = (message, conversationId) => {
  if (!message || !conversationId) return ''
  
  const key = simpleHash(conversationId)
  const data = { message, timestamp: Date.now() }
  return encryptLocalStorageData(data, key)
}

export const decryptDraftMessage = (encryptedDraft, conversationId) => {
  if (!encryptedDraft || !conversationId) return null
  
  const key = simpleHash(conversationId)
  const decrypted = decryptLocalStorageData(encryptedDraft, key)
  
  // Check expiry (24 hours)
  if (decrypted?.timestamp && Date.now() - decrypted.timestamp > 24 * 60 * 60 * 1000) {
    return null
  }
  
  return decrypted
}

// Token and ID generation
export const generateRandomToken = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return token
}

export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Data obfuscation for display
export const obfuscateEmail = (email) => {
  if (!email?.includes('@')) return email
  
  const [username, domain] = email.split('@')
  if (username.length <= 3) return email
  
  const visibleStart = username.slice(0, 2)
  const visibleEnd = username.slice(-1)
  const stars = '*'.repeat(Math.max(1, username.length - 3))
  
  return `${visibleStart}${stars}${visibleEnd}@${domain}`
}

export const obfuscatePhone = (phone) => {
  if (!phone) return phone
  
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length < 6) return phone
  
  const visibleStart = cleaned.slice(0, 2)
  const visibleEnd = cleaned.slice(-2)
  const stars = '*'.repeat(Math.max(2, cleaned.length - 4))
  
  return `${visibleStart}${stars}${visibleEnd}`
}

// Security utilities
export const secureRandom = (min = 0, max = 1) => {
  if (window.crypto?.getRandomValues) {
    const array = new Uint32Array(1)
    window.crypto.getRandomValues(array)
    return min + (array[0] / (0xFFFFFFFF + 1)) * (max - min)
  }
  
  return min + Math.random() * (max - min)
}

export const sanitizeHTML = (html) => {
  if (!html) return ''
  const temp = document.createElement('div')
  temp.textContent = html
  return temp.innerHTML
}

export const escapeHtml = (str) => {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

// Device fingerprinting (basic)
export const generateDeviceFingerprint = () => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.textBaseline = 'top'
  ctx.font = '14px Arial'
  ctx.fillText('Device fingerprint', 2, 2)
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
  ].join('|')
  
  return simpleHash(fingerprint)
}
