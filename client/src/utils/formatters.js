import { format, formatDistance, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns'

/**
 * Format timestamp for message display
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Formatted time
 */
export const formatMessageTime = (timestamp) => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  const now = new Date()
  
  // If invalid date
  if (isNaN(date.getTime())) return ''
  
  // If today, show time only
  if (isToday(date)) {
    return format(date, 'HH:mm')
  }
  
  // If yesterday
  if (isYesterday(date)) {
    return `Yesterday ${format(date, 'HH:mm')}`
  }
  
  // If this week
  if (isThisWeek(date)) {
    return format(date, 'EEE HH:mm')
  }
  
  // If this year
  if (isThisYear(date)) {
    return format(date, 'MMM dd HH:mm')
  }
  
  // Full date
  return format(date, 'MMM dd, yyyy HH:mm')
}

/**
 * Format timestamp for conversation list
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Formatted time
 */
export const formatConversationTime = (timestamp) => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  
  // If invalid date
  if (isNaN(date.getTime())) return ''
  
  // If today, show time only
  if (isToday(date)) {
    return format(date, 'HH:mm')
  }
  
  // If yesterday
  if (isYesterday(date)) {
    return 'Yesterday'
  }
  
  // If this week
  if (isThisWeek(date)) {
    return format(date, 'EEE')
  }
  
  // If this year
  if (isThisYear(date)) {
    return format(date, 'MMM dd')
  }
  
  // Full date
  return format(date, 'MMM dd, yyyy')
}

/**
 * Format last seen time for user status
 * @param {string|Date} lastSeen - Last seen timestamp
 * @returns {string} Formatted last seen
 */
export const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return 'Never'
  
  const date = new Date(lastSeen)
  const now = new Date()
  
  // If invalid date
  if (isNaN(date.getTime())) return 'Never'
  
  // If within 5 minutes, consider online
  const diffInMinutes = (now - date) / (1000 * 60)
  if (diffInMinutes <= 5) return 'Online'
  
  // If today
  if (isToday(date)) {
    return `Last seen ${format(date, 'HH:mm')}`
  }
  
  // If yesterday
  if (isYesterday(date)) {
    return `Last seen yesterday ${format(date, 'HH:mm')}`
  }
  
  // If within a week
  if (diffInMinutes <= 7 * 24 * 60) {
    return `Last seen ${format(date, 'EEE HH:mm')}`
  }
  
  // If this year
  if (isThisYear(date)) {
    return `Last seen ${format(date, 'MMM dd')}`
  }
  
  // Long time ago
  return `Last seen ${format(date, 'MMM dd, yyyy')}`
}

/**
 * Format relative time (e.g., "2 minutes ago")
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Relative time
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  
  // If invalid date
  if (isNaN(date.getTime())) return ''
  
  return formatDistance(date, new Date(), { addSuffix: true })
}

/**
 * Format full date and time
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Full formatted date and time
 */
export const formatFullDateTime = (timestamp) => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  
  // If invalid date
  if (isNaN(date.getTime())) return ''
  
  return format(date, 'EEEE, MMMM dd, yyyy \'at\' HH:mm')
}

/**
 * Format date only
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Formatted date
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  
  // If invalid date
  if (isNaN(date.getTime())) return ''
  
  return format(date, 'MMMM dd, yyyy')
}

/**
 * Format time only
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Formatted time
 */
export const formatTime = (timestamp) => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  
  // If invalid date
  if (isNaN(date.getTime())) return ''
  
  return format(date, 'HH:mm')
}

/**
 * Format duration in human readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Check if timestamp is from today
 * @param {string|Date} timestamp - Timestamp to check
 * @returns {boolean} True if from today
 */
export const isFromToday = (timestamp) => {
  if (!timestamp) return false
  const date = new Date(timestamp)
  return !isNaN(date.getTime()) && isToday(date)
}

/**
 * Check if timestamp is from yesterday
 * @param {string|Date} timestamp - Timestamp to check
 * @returns {boolean} True if from yesterday
 */
export const isFromYesterday = (timestamp) => {
  if (!timestamp) return false
  const date = new Date(timestamp)
  return !isNaN(date.getTime()) && isYesterday(date)
}

/**
 * Get greeting based on current time
 * @returns {string} Greeting message
 */
export const getTimeBasedGreeting = () => {
  const hour = new Date().getHours()
  
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Format typing indicator timestamp
 * @param {string|Date} timestamp - When user started typing
 * @returns {string} Formatted typing time
 */
export const formatTypingTime = (timestamp) => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  const now = new Date()
  const diffInSeconds = (now - date) / 1000
  
  // If invalid date or too old (more than 10 seconds), don't show
  if (isNaN(date.getTime()) || diffInSeconds > 10) return ''
  
  return 'typing...'
}

/**
 * Create date separators for message lists
 * @param {string|Date} timestamp - Message timestamp
 * @param {string|Date} previousTimestamp - Previous message timestamp
 * @returns {string|null} Date separator text or null
 */
export const createDateSeparator = (timestamp, previousTimestamp) => {
  if (!timestamp) return null
  
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) return null
  
  // If no previous timestamp, show separator
  if (!previousTimestamp) {
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'EEEE, MMMM dd, yyyy')
  }
  
  const prevDate = new Date(previousTimestamp)
  if (isNaN(prevDate.getTime())) return null
  
  // If same day, no separator needed
  if (format(date, 'yyyy-MM-dd') === format(prevDate, 'yyyy-MM-dd')) {
    return null
  }
  
  // Different days, show separator
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'EEEE, MMMM dd, yyyy')
}

/**
 * Format file timestamp for uploads
 * @param {string|Date} timestamp - Upload timestamp
 * @returns {string} Formatted upload time
 */
export const formatFileUploadTime = (timestamp) => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  
  // If invalid date
  if (isNaN(date.getTime())) return ''
  
  // If today
  if (isToday(date)) {
    return `Today at ${format(date, 'HH:mm')}`
  }
  
  // If yesterday
  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'HH:mm')}`
  }
  
  // If this year
  if (isThisYear(date)) {
    return format(date, 'MMM dd \'at\' HH:mm')
  }
  
  // Full date
  return format(date, 'MMM dd, yyyy \'at\' HH:mm')
}
