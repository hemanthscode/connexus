import { motion } from 'framer-motion'
import { clsx } from 'clsx'

// Loading Spinner Component
export const LoadingSpinner = ({ 
  size = 'md', 
  color = 'cyan',
  className = '' 
}) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  }
  
  const colors = {
    cyan: 'border-cyan-400/30 border-t-cyan-400',
    white: 'border-white/30 border-t-white',
    gray: 'border-gray-400/30 border-t-gray-400',
    red: 'border-red-400/30 border-t-red-400',
    green: 'border-green-400/30 border-t-green-400',
  }
  
  return (
    <div 
      className={clsx(
        'animate-spin rounded-full',
        sizes[size],
        colors[color],
        className
      )}
    />
  )
}

// Loading Dots Component
export const LoadingDots = ({ 
  size = 'md',
  color = 'cyan',
  className = '' 
}) => {
  const sizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  }
  
  const colors = {
    cyan: 'bg-cyan-400',
    white: 'bg-white',
    gray: 'bg-gray-400',
    red: 'bg-red-400',
    green: 'bg-green-400',
  }
  
  const dotVariants = {
    initial: { opacity: 0.4, scale: 0.8 },
    animate: { opacity: 1, scale: 1.2 },
  }
  
  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.2,
        repeat: Infinity,
        repeatType: "reverse",
        duration: 0.8,
      },
    },
  }
  
  return (
    <motion.div 
      className={clsx('flex items-center justify-center gap-1', className)}
      variants={containerVariants}
      animate="animate"
    >
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={clsx(
            'rounded-full',
            sizes[size],
            colors[color]
          )}
          variants={dotVariants}
        />
      ))}
    </motion.div>
  )
}

// Loading Pulse Component
export const LoadingPulse = ({ 
  children,
  className = '' 
}) => {
  return (
    <motion.div
      className={clsx('glass rounded-lg p-4', className)}
      animate={{
        opacity: [0.5, 1, 0.5],
        scale: [0.98, 1, 0.98],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  )
}

// Skeleton Loading Components
export const SkeletonLine = ({ 
  width = '100%', 
  height = '1rem',
  className = '' 
}) => {
  return (
    <div
      className={clsx(
        'loading-skeleton rounded animate-pulse',
        className
      )}
      style={{ width, height }}
    />
  )
}

export const SkeletonCircle = ({ 
  size = '3rem',
  className = '' 
}) => {
  return (
    <div
      className={clsx(
        'loading-skeleton rounded-full animate-pulse',
        className
      )}
      style={{ width: size, height: size }}
    />
  )
}

export const SkeletonAvatar = ({ className = '' }) => {
  return (
    <SkeletonCircle 
      size="2.5rem"
      className={className}
    />
  )
}

export const SkeletonMessage = ({ isOwn = false, className = '' }) => {
  return (
    <div className={clsx(
      'flex gap-3 mb-4',
      isOwn ? 'justify-end' : 'justify-start',
      className
    )}>
      {!isOwn && <SkeletonAvatar />}
      <div className={clsx(
        'flex flex-col gap-2 max-w-xs',
        isOwn && 'items-end'
      )}>
        <SkeletonLine width="120px" height="0.75rem" />
        <div className={clsx(
          'glass rounded-2xl p-3 space-y-2',
          isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'
        )}>
          <SkeletonLine width="200px" height="0.875rem" />
          <SkeletonLine width="150px" height="0.875rem" />
        </div>
      </div>
      {isOwn && <SkeletonAvatar />}
    </div>
  )
}

export const SkeletonConversation = ({ className = '' }) => {
  return (
    <div className={clsx('flex items-center gap-3 p-3', className)}>
      <SkeletonAvatar />
      <div className="flex-1 space-y-2">
        <SkeletonLine width="60%" height="1rem" />
        <SkeletonLine width="80%" height="0.75rem" />
      </div>
      <div className="text-right space-y-2">
        <SkeletonLine width="40px" height="0.75rem" />
        <SkeletonCircle size="1.5rem" />
      </div>
    </div>
  )
}

// Full Page Loading Component
export const PageLoading = ({ 
  message = 'Loading...',
  className = '' 
}) => {
  return (
    <motion.div 
      className={clsx(
        'fixed inset-0 bg-dark-bg/90 backdrop-blur-sm',
        'flex items-center justify-center z-50',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="glass rounded-xl p-8 text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-300 text-lg">{message}</p>
      </div>
    </motion.div>
  )
}

// Loading Overlay Component
export const LoadingOverlay = ({ 
  show = false,
  message = 'Loading...',
  children,
  className = '' 
}) => {
  return (
    <div className={clsx('relative', className)}>
      {children}
      {show && (
        <motion.div
          className="absolute inset-0 bg-dark-bg/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="glass rounded-lg p-6 text-center">
            <LoadingSpinner size="md" className="mx-auto mb-3" />
            <p className="text-gray-300">{message}</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Inline Loading Component
export const InlineLoading = ({ 
  message = 'Loading...',
  size = 'sm',
  className = '' 
}) => {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <LoadingSpinner size={size} />
      <span className="text-gray-400 text-sm">{message}</span>
    </div>
  )
}

// Button Loading Component
export const ButtonLoading = ({ className = '' }) => {
  return (
    <LoadingSpinner 
      size="sm" 
      color="white"
      className={className}
    />
  )
}

// Default Loading Component
const Loading = ({ 
  type = 'spinner',
  size = 'md',
  color = 'cyan',
  message = null,
  fullScreen = false,
  className = '' 
}) => {
  const LoadingComponent = {
    spinner: LoadingSpinner,
    dots: LoadingDots,
    pulse: LoadingPulse,
  }[type] || LoadingSpinner
  
  const content = (
    <div className={clsx(
      'flex flex-col items-center justify-center gap-3',
      className
    )}>
      <LoadingComponent size={size} color={color} />
      {message && (
        <p className="text-gray-400 text-sm">{message}</p>
      )}
    </div>
  )
  
  if (fullScreen) {
    return (
      <motion.div 
        className="fixed inset-0 bg-dark-bg/90 backdrop-blur-sm flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="glass rounded-xl p-8">
          {content}
        </div>
      </motion.div>
    )
  }
  
  return content
}

export default Loading
