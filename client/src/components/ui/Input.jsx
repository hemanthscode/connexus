import { forwardRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { clsx } from 'clsx'

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
  
  const handleFocus = (e) => {
    setFocused(true)
    onFocus?.(e)
  }
  
  const handleBlur = (e) => {
    setFocused(false)
    onBlur?.(e)
  }
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }
  
  const baseClasses = `
    w-full px-4 py-3 rounded-lg
    bg-transparent text-white placeholder-gray-400
    border transition-all duration-300
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
    disabled:cursor-not-allowed disabled:opacity-50
  `
  
  const stateClasses = clsx({
    // Default state
    'border-gray-600/50 focus:border-cyan-400/70 focus:ring-cyan-400/30': !error && !success,
    // Error state
    'border-red-500/70 focus:border-red-400/70 focus:ring-red-400/30': error,
    // Success state
    'border-green-500/70 focus:border-green-400/70 focus:ring-green-400/30': success,
    // Focused state with glow
    'shadow-neon-cyan': focused && !error && !success,
    'shadow-[0_0_20px_rgba(239,68,68,0.3)]': focused && error,
    'shadow-[0_0_20px_rgba(34,197,94,0.3)]': focused && success,
  })
  
  const containerClasses = clsx(
    'relative',
    containerClassName
  )
  
  const inputClasses = clsx(
    baseClasses,
    stateClasses,
    {
      'pl-11': leftIcon,
      'pr-11': rightIcon || isPassword,
      'glass': !error && !success,
      'glass border-red-500/30': error,
      'glass border-green-500/30': success,
    },
    className
  )
  
  return (
    <div className={containerClasses}>
      {/* Label */}
      {label && (
        <motion.label
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={clsx(
            'block text-sm font-medium mb-2 transition-colors duration-200',
            focused ? 'text-cyan-400' : 'text-gray-300',
            error && 'text-red-400',
            success && 'text-green-400'
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
            <span className={clsx(
              'transition-colors duration-200',
              focused ? 'text-cyan-400' : 'text-gray-400',
              error && 'text-red-400',
              success && 'text-green-400'
            )}>
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
          className={inputClasses}
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
                  'focus:outline-none transition-colors duration-200 hover:scale-110',
                  focused ? 'text-cyan-400' : 'text-gray-400',
                  'hover:text-cyan-300'
                )}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            ) : (
              <span className={clsx(
                'transition-colors duration-200',
                focused ? 'text-cyan-400' : 'text-gray-400',
                error && 'text-red-400',
                success && 'text-green-400'
              )}>
                {rightIcon}
              </span>
            )}
          </div>
        )}
        
        {/* Focus ring effect */}
        <div className={clsx(
          'absolute inset-0 rounded-lg pointer-events-none transition-opacity duration-300',
          focused && !error && !success && 'bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent opacity-100',
          focused && error && 'bg-gradient-to-r from-transparent via-red-400/5 to-transparent opacity-100',
          focused && success && 'bg-gradient-to-r from-transparent via-green-400/5 to-transparent opacity-100',
          !focused && 'opacity-0'
        )} />
      </div>
      
      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-400 flex items-center gap-1"
        >
          <span className="text-red-400">•</span>
          {error}
        </motion.p>
      )}
      
      {/* Success Message */}
      {success && typeof success === 'string' && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-green-400 flex items-center gap-1"
        >
          <span className="text-green-400">•</span>
          {success}
        </motion.p>
      )}
      
      {/* Hint */}
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
