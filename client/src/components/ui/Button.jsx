import { forwardRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

// Style configurations
const STYLES = {
  base: 'relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden group',
  
  variants: {
    primary: 'glass text-white border-cyan-400/30 hover:bg-cyan-500/20 hover:border-cyan-400/50 focus:ring-cyan-400/50 shadow-lg hover:shadow-neon-cyan',
    secondary: 'glass-dark text-gray-300 border-gray-500/30 hover:bg-gray-500/20 hover:border-gray-400/50 focus:ring-gray-400/50 shadow-lg',
    danger: 'glass text-white border-red-500/30 hover:bg-red-500/20 hover:border-red-400/50 focus:ring-red-400/50 shadow-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]',
    success: 'glass text-white border-green-500/30 hover:bg-green-500/20 hover:border-green-400/50 focus:ring-green-400/50 shadow-lg hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]',
    ghost: 'bg-transparent text-gray-300 border-transparent hover:bg-white/10 hover:text-white focus:ring-cyan-400/50',
    outline: 'bg-transparent text-cyan-400 border-cyan-400/50 hover:bg-cyan-500/10 hover:border-cyan-400/70 focus:ring-cyan-400/50',
  },
  
  sizes: {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
    xl: 'px-8 py-4 text-xl gap-3',
    icon: 'p-2 text-base',
  }
}

const ANIMATIONS = {
  initial: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
}

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}, ref) => {
  const buttonClass = useMemo(() => clsx(
    STYLES.base,
    STYLES.variants[variant],
    STYLES.sizes[size],
    fullWidth && 'w-full',
    className
  ), [variant, size, fullWidth, className])

  const isInteractive = !disabled && !loading
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-transparent border-t-current" />
          {children && <span>Loading...</span>}
        </div>
      )
    }

    return (
      <>
        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children && <span>{children}</span>}
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </>
    )
  }

  return (
    <motion.button
      ref={ref}
      type={type}
      className={buttonClass}
      disabled={disabled || loading}
      onClick={onClick}
      variants={ANIMATIONS}
      initial="initial"
      whileHover={isInteractive ? "hover" : "initial"}
      whileTap={isInteractive ? "tap" : "initial"}
      {...props}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-pulse" />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {renderContent()}
      </div>
    </motion.button>
  )
})

Button.displayName = 'Button'

export default Button
