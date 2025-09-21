/**
 * Format date to relative time like "5 minutes ago"
 */
export function formatRelativeTime(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60) return 'Just now'
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 }
  ]
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count >= 1) return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`
  }
  return 'Some time ago'
}

/**
 * Format ISO date string to HH:mm (24h) format
 */
export function formatTimeHM(date) {
  const d = new Date(date)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
