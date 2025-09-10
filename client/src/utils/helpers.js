export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export const debounce = (func, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

export const groupMessagesByDate = (messages) => {
  return messages.reduce((groups, message) => {
    const date = new Date(message.timestamp).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {})
}

export const truncateText = (text, length = 50) => {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

export const isMobile = () => {
  return window.innerWidth < 768
}

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}

export const smoothScrollTo = (element) => {
  element?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest'
  })
}
