import { forwardRef, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { clsx } from 'clsx'

// Style configurations
const STYLES = {
  base: 'w-full px-4 py-3 rounded-lg bg-transparent text-white placeholder-gray-400 border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50',
  
  states: {
    default: 'border-gray-600/50 focus:border-cyan-400/70 focus:ring-cyan-400/30 glass',
    error: 'border-red-500/70 focus:border-red-400/70 focus:ring-red-400/30 glass border-red-500/30',
    success: 'border-green-500/70 focus:border-green-400/70 focus:ring-green-400/30 glass border-green-500/30',
  },
  
  shadows: {
    default: 'shadow-neon-cyan',
    error: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    success: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]',
  },
  
  colors: {
    default: 'text-cyan-400',
    error: 'text-red-400',
    success: 'text-green-400',
    muted: 'text-gray-400',
    label: 'text-gray-300',
  }
}

const Input = forwardRef(({
  type = 'text',
  placeholder = '',
  value = '',
  onChange,
  onFocus,
  onBlur,
  disabled = false,
  error = null,
  success = false,
  leftIcon = null,
  rightIcon = null,
  label = null,
  hint = null,
  required = false,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type
  const state = error ? 'error' : success ? 'success' : 'default'

  const handleFocus = (e) => {
    setFocused(true)
    onFocus?.(e)
  }

  const handleBlur = (e) => {
    setFocused(false)
    onBlur?.(e)
  }

  const togglePasswordVisibility = () => setShowPassword(!showPassword)

  const inputClass = useMemo(() => clsx(
    STYLES.base,
    STYLES.states[state],
    {
      'pl-11': leftIcon,
      'pr-11': rightIcon || isPassword,
      [STYLES.shadows[state]]: focused,
    },
    className
  ), [state, leftIcon, rightIcon, isPassword, focused, className])

  const iconColorClass = focused ? STYLES.colors[state] : STYLES.colors.muted

  const renderMessage = (message, type) => (
    <motion.p
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-2 text-sm ${STYLES.colors[type]} flex items-center gap-1`}
    >
      <span>•</span>
      {message}
    </motion.p>
  )

  return (
    <div className={clsx('relative', containerClassName)}>
      {/* Label */}
      {label && (
        <motion.label
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={clsx(
            'block text-sm font-medium mb-2 transition-colors duration-200',
            focused ? STYLES.colors[state] : STYLES.colors.label
          )}
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </motion.label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className={clsx('transition-colors duration-200', iconColorClass)}>
              {leftIcon}
            </span>
          </div>
        )}

        {/* Input Field */}
        <motion.input
          ref={ref}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={inputClass}
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          {...props}
        />

        {/* Right Icon or Password Toggle */}
        {(rightIcon || isPassword) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {isPassword ? (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className={clsx(
                  'focus:outline-none transition-all duration-200 hover:scale-110',
                  focused ? STYLES.colors.default : STYLES.colors.muted,
                  'hover:text-cyan-300'
                )}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            ) : (
              <span className={clsx('transition-colors duration-200', iconColorClass)}>
                {rightIcon}
              </span>
            )}
          </div>
        )}

        {/* Focus ring effect */}
        <div className={clsx(
          'absolute inset-0 rounded-lg pointer-events-none transition-opacity duration-300',
          focused && `bg-gradient-to-r from-transparent via-${state === 'error' ? 'red' : state === 'success' ? 'green' : 'cyan'}-400/5 to-transparent opacity-100`,
          !focused && 'opacity-0'
        )} />
      </div>

      {/* Messages */}
      {error && renderMessage(error, 'error')}
      {success && typeof success === 'string' && renderMessage(success, 'success')}
      {hint && !error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-sm text-gray-500"
        >
          {hint}
        </motion.p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
