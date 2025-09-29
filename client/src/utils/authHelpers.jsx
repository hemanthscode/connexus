import { Eye, EyeOff, Github, Chrome } from 'lucide-react'

// Create password visibility toggle button
export const createPasswordToggle = (isVisible, onToggle) => (
  <button
    type="button"
    onClick={onToggle}
    className="text-gray-400 hover:text-gray-300 transition-colors"
  >
    {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
  </button>
)

// Get social login providers configuration
export const getSocialProviders = (action = 'continue') => [
  {
    name: 'Google',
    icon: <Chrome className="w-5 h-5" />,
    color: 'bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-400',
    onClick: () => {/* Handle Google auth */}
  },
  {
    name: 'GitHub',
    icon: <Github className="w-5 h-5" />,
    color: 'bg-gray-500/20 hover:bg-gray-500/30 border-gray-500/50 text-gray-400',
    onClick: () => {/* Handle GitHub auth */}
  }
]

// Get form field animation properties
export const getFormAnimationProps = (index) => ({
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { delay: index * 0.1 }
})

// Common form field validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  name: /^[a-zA-Z\s]{2,50}$/
}

// Form field error messages
export const VALIDATION_MESSAGES = {
  email: {
    required: 'Email is required',
    invalid: 'Please enter a valid email address'
  },
  password: {
    required: 'Password is required',
    weak: 'Password must be at least 8 characters with uppercase, lowercase, number and special character'
  },
  name: {
    required: 'Name is required',
    invalid: 'Name must be 2-50 characters and contain only letters'
  },
  confirmPassword: {
    required: 'Please confirm your password',
    mismatch: 'Passwords do not match'
  }
}
