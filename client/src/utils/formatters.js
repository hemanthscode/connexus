import { format, formatDistance, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns'

// Base date validation and parsing
const parseDate = (timestamp) => {
  if (!timestamp) return null
  const date = new Date(timestamp)
  return isNaN(date.getTime()) ? null : date
}

// Common time format patterns
const TIME_FORMATS = {
  TIME_ONLY: 'HH:mm',
  DATE_TIME: 'MMM dd HH:mm',
  FULL_DATE: 'MMM dd, yyyy',
  FULL_DATE_TIME: 'MMM dd, yyyy HH:mm',
  WEEKDAY: 'EEE',
  WEEKDAY_TIME: 'EEE HH:mm',
  FULL_DATETIME: 'EEEE, MMMM dd, yyyy \'at\' HH:mm'
}

/**
 * Core date formatter with consistent logic
 */
const formatWithPattern = (timestamp, patterns) => {
  const date = parseDate(timestamp)
  if (!date) return ''
  
  const now = new Date()
  
  if (isToday(date)) return patterns.today || format(date, TIME_FORMATS.TIME_ONLY)
  if (isYesterday(date)) return patterns.yesterday || `Yesterday ${patterns.showTime ? format(date, TIME_FORMATS.TIME_ONLY) : ''}`
  if (isThisWeek(date)) return patterns.thisWeek || format(date, patterns.showTime ? TIME_FORMATS.WEEKDAY_TIME : TIME_FORMATS.WEEKDAY)
  if (isThisYear(date)) return patterns.thisYear || format(date, patterns.showTime ? TIME_FORMATS.DATE_TIME : 'MMM dd')
  
  return patterns.default || format(date, patterns.showTime ? TIME_FORMATS.FULL_DATE_TIME : TIME_FORMATS.FULL_DATE)
}

/**
 * Format timestamp for message display
 */
export const formatMessageTime = (timestamp) => {
  return formatWithPattern(timestamp, {
    showTime: true,
    yesterday: (date) => `Yesterday ${format(date, TIME_FORMATS.TIME_ONLY)}`,
  })
}

/**
 * Format timestamp for conversation list
 */
export const formatConversationTime = (timestamp) => {
  return formatWithPattern(timestamp, {
    yesterday: 'Yesterday',
    showTime: false,
  })
}

/**
 * Format last seen time for user status
 */
export const formatLastSeen = (lastSeen) => {
  const date = parseDate(lastSeen)
  if (!date) return 'Never'
  
  const now = new Date()
  const diffInMinutes = (now - date) / (1000 * 60)
  
  // Online threshold
  if (diffInMinutes <= 5) return 'Online'
  
  return formatWithPattern(lastSeen, {
    today: (date) => `Last seen ${format(date, TIME_FORMATS.TIME_ONLY)}`,
    yesterday: (date) => `Last seen yesterday ${format(date, TIME_FORMATS.TIME_ONLY)}`,
    thisWeek: (date) => `Last seen ${format(date, TIME_FORMATS.WEEKDAY_TIME)}`,
    thisYear: (date) => `Last seen ${format(date, 'MMM dd')}`,
    default: (date) => `Last seen ${format(date, TIME_FORMATS.FULL_DATE)}`,
  })
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export const formatRelativeTime = (timestamp) => {
  const date = parseDate(timestamp)
  return date ? formatDistance(date, new Date(), { addSuffix: true }) : ''
}

/**
 * Format full date and time
 */
export const formatFullDateTime = (timestamp) => {
  const date = parseDate(timestamp)
  return date ? format(date, TIME_FORMATS.FULL_DATETIME) : ''
}

/**
 * Format date only
 */
export const formatDate = (timestamp) => {
  const date = parseDate(timestamp)
  return date ? format(date, 'MMMM dd, yyyy') : ''
}

/**
 * Format time only
 */
export const formatTime = (timestamp) => {
  const date = parseDate(timestamp)
  return date ? format(date, TIME_FORMATS.TIME_ONLY) : ''
}

/**
 * Format duration in human readable format
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
 * Date validation helpers
 */
export const isFromToday = (timestamp) => {
  const date = parseDate(timestamp)
  return date ? isToday(date) : false
}

export const isFromYesterday = (timestamp) => {
  const date = parseDate(timestamp)
  return date ? isYesterday(date) : false
}

/**
 * Get time-based greeting
 */
export const getTimeBasedGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Create date separator for message lists
 */
export const createDateSeparator = (timestamp, previousTimestamp) => {
  const date = parseDate(timestamp)
  if (!date) return null
  
  // If no previous timestamp, show separator
  if (!previousTimestamp) {
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'EEEE, MMMM dd, yyyy')
  }
  
  const prevDate = parseDate(previousTimestamp)
  if (!prevDate) return null
  
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
 * Format file upload time
 */
export const formatFileUploadTime = (timestamp) => {
  return formatWithPattern(timestamp, {
    today: (date) => `Today at ${format(date, TIME_FORMATS.TIME_ONLY)}`,
    yesterday: (date) => `Yesterday at ${format(date, TIME_FORMATS.TIME_ONLY)}`,
    thisYear: (date) => format(date, 'MMM dd \'at\' HH:mm'),
    default: (date) => format(date, 'MMM dd, yyyy \'at\' HH:mm'),
  })
}

/**
 * Format typing indicator (returns empty string if too old)
 */
export const formatTypingTime = (timestamp) => {
  const date = parseDate(timestamp)
  if (!date) return ''
  
  const diffInSeconds = (new Date() - date) / 1000
  return diffInSeconds <= 10 ? 'typing...' : ''
}
