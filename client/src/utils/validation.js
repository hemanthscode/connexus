const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validate email format
 */
export function validateEmail(email) {
  return emailRegex.test(email.toLowerCase())
}

/**
 * Validate password with rules:
 * - min length 8
 * - contains uppercase, lowercase, number
 */
export function validatePassword(password) {
  if(!password) return false
  const hasMinLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNum = /\d/.test(password)
  return hasMinLength && hasUpper && hasLower && hasNum
}

/**
 * Validate name (non-empty)
 */
export function validateName(name) {
  return typeof name === 'string' && name.trim().length > 0
}
