import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { useTyping } from '@/hooks/useTyping.jsx'

const TypingIndicator = ({
  conversationId,
  compact = false,
  showAvatars = true,
  maxUsers = 3,
  className = '',
  ...props
}) => {
  const { typingUsers, hasTypingUsers, formattedTypingUsers } = useTyping(conversationId, {
    showSelfTyping: false,
    maxTypingUsers: maxUsers
  })

  if (!hasTypingUsers) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: 20, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={clsx('flex items-end gap-3 mb-4', className)}
        {...props}
      >
        {/* Avatars */}
        {showAvatars && !compact && (
          <div className="flex-shrink-0 flex -space-x-2">
            {typingUsers.slice(0, maxUsers).map((typingUser, index) => (
              <motion.img
                key={typingUser.userId}
                src={typingUser.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(typingUser.user?.name || 'U')}&background=0ea5e9&color=fff&size=40&rounded=true`}
                alt={typingUser.user?.name || 'User'}
                className="w-8 h-8 rounded-full ring-2 ring-dark-bg"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              />
            ))}
          </div>
        )}

        {/* Typing Bubble */}
        <motion.div
          className={clsx(
            'glass rounded-2xl rounded-tl-sm px-4 py-2 relative',
            'bg-gray-800/50 border-gray-600/30',
            compact && 'px-3 py-1.5'
          )}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <div className="flex items-center gap-2">
            {/* Typing Animation Dots */}
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className={clsx(
                    'rounded-full bg-gray-400',
                    compact ? 'w-1.5 h-1.5' : 'w-2 h-2'
                  )}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: index * 0.2,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
            
            {/* Typing Text */}
            {!compact && (
              <span className="text-sm text-gray-400 ml-1">
                {formattedTypingUsers}
              </span>
            )}
          </div>

          {/* Animated Background Effect */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0"
            animate={{ 
              opacity: [0, 0.5, 0],
              x: [-100, 100]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Compact typing indicator for headers/status bars
export const CompactTypingIndicator = ({
  conversationId,
  className = '',
  ...props
}) => {
  const { hasTypingUsers, formattedTypingUsers } = useTyping(conversationId)

  if (!hasTypingUsers) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={clsx(
        'flex items-center gap-2 text-sm text-green-400',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-0.5">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-1 h-1 rounded-full bg-green-400"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <span className="truncate">{formattedTypingUsers}</span>
    </motion.div>
  )
}

// Floating typing indicator (for mobile/overlay)
export const FloatingTypingIndicator = ({
  conversationId,
  position = 'bottom-left',
  className = '',
  ...props
}) => {
  const { hasTypingUsers, typingUsers } = useTyping(conversationId)

  if (!hasTypingUsers) return null

  const positionClasses = {
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className={clsx(
          'fixed z-50 glass rounded-full px-4 py-2 border border-gray-600/50',
          'backdrop-blur-xl shadow-lg',
          positionClasses[position],
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-3">
          {/* User Avatars */}
          <div className="flex -space-x-2">
            {typingUsers.slice(0, 2).map((typingUser) => (
              <img
                key={typingUser.userId}
                src={typingUser.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(typingUser.user?.name || 'U')}&size=24`}
                alt={typingUser.user?.name || 'User'}
                className="w-6 h-6 rounded-full ring-2 ring-dark-bg"
              />
            ))}
          </div>

          {/* Typing Animation */}
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Typing indicator for conversation list
export const ConversationTypingIndicator = ({
  conversationId,
  className = '',
  ...props
}) => {
  const { hasTypingUsers, typingUsers } = useTyping(conversationId, {
    maxTypingUsers: 1
  })

  if (!hasTypingUsers) return null

  const typingUser = typingUsers[0]

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={clsx(
        'flex items-center gap-2 text-sm text-green-400',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-0.5">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-1 h-1 rounded-full bg-green-400"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: index * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <span className="truncate">
        {typingUser?.user?.name || 'Someone'} is typing...
      </span>
    </motion.div>
  )
}

// Voice message recording indicator
export const VoiceRecordingIndicator = ({
  duration = 0,
  isRecording = false,
  className = '',
  ...props
}) => {
  if (!isRecording) return null

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={clsx(
        'flex items-center gap-3 glass rounded-full px-4 py-2',
        'border border-red-500/30 bg-red-500/10',
        className
      )}
      {...props}
    >
      {/* Recording Animation */}
      <motion.div
        className="w-3 h-3 bg-red-400 rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />

      <span className="text-red-400 text-sm font-medium">
        Recording
      </span>

      {/* Duration */}
      <span className="text-red-400 text-sm font-mono">
        {formatDuration(duration)}
      </span>

      {/* Waveform Animation */}
      <div className="flex items-center gap-0.5">
        {[0, 1, 2, 3, 4].map((index) => (
          <motion.div
            key={index}
            className="w-0.5 bg-red-400 rounded-full"
            animate={{ height: [4, 12, 8, 16, 6] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: index * 0.1,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

export default TypingIndicator
