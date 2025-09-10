import { 
  formatDistanceToNow, 
  format, 
  isToday, 
  isYesterday,
  parseISO 
} from 'date-fns'

export const formatRelativeTime = (timestamp) => {
  try {
    const date = parseISO(timestamp)
    
    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true })
    }
    
    if (isYesterday(date)) {
      return 'Yesterday'
    }
    
    return format(date, 'MMM d')
  } catch (error) {
    return 'Just now'
  }
}

export const formatMessageTime = (timestamp) => {
  try {
    const date = parseISO(timestamp)
    return format(date, 'HH:mm')
  } catch (error) {
    return '00:00'
  }
}

export const formatMessageDate = (dateString) => {
  try {
    const date = parseISO(dateString)
    
    if (isToday(date)) {
      return 'Today'
    }
    
    if (isYesterday(date)) {
      return 'Yesterday'
    }
    
    return format(date, 'EEEE, MMM d')
  } catch (error) {
    return 'Today'
  }
}

export const formatLastSeen = (timestamp) => {
  try {
    const date = parseISO(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Active now'
    if (diffInMinutes < 60) return `Last seen ${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
    
    return `Last seen ${formatDistanceToNow(date, { addSuffix: true })}`
  } catch (error) {
    return 'Recently active'
  }
}
