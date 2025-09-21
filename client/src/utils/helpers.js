/**
 * Generate initials from full name
 * e.g. "John Doe" -> "JD"
 */
export function getInitials(name) {
  if (!name) return ''
  const parts = name.trim().split(' ')
  if(parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(string) {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str) {
  if(!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}
