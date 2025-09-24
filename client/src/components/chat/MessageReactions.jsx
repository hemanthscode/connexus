import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Smile } from 'lucide-react'
import { clsx } from 'clsx'
import Button from '../ui/Button.jsx'
import { useMessageReactions } from '@/hooks/useMessages.jsx'
import { useAuth } from '@/hooks/useAuth.jsx'
import { EMOJI_REACTIONS } from '@/utils/constants.js'

const MessageReactions = ({
  message,
  conversationId,
  compact = false,
  showAddButton = true,
  maxReactions = 6,
  className = '',
  ...props
}) => {
  const { toggleReaction, isProcessing } = useMessageReactions(conversationId)
  const { user } = useAuth()
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showAllReactions, setShowAllReactions] = useState(false)
  
  const emojiPickerRef = useRef(null)

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  if (!message?.reactions?.length && !showAddButton) {
    return null
  }

  // Group reactions by emoji
  const groupedReactions = message.reactions?.reduce((acc, reaction) => {
    const emoji = reaction.emoji
    if (!acc[emoji]) {
      acc[emoji] = {
        emoji,
        count: 0,
        users: [],
        hasUserReacted: false
      }
    }
    
    acc[emoji].count++
    acc[emoji].users.push(reaction.user)
    
    if (reaction.user === user?._id) {
      acc[emoji].hasUserReacted = true
    }
    
    return acc
  }, {}) || {}

  const reactionEntries = Object.entries(groupedReactions)
  const visibleReactions = showAllReactions 
    ? reactionEntries 
    : reactionEntries.slice(0, maxReactions)
  const hiddenCount = reactionEntries.length - maxReactions

  // Handle reaction click
  const handleReactionClick = async (emoji) => {
    if (isProcessing(message._id, emoji)) return
    await toggleReaction(message._id, emoji)
  }

  // Handle add reaction
  const handleAddReaction = (emoji) => {
    setShowEmojiPicker(false)
    handleReactionClick(emoji)
  }

  return (
    <div className={clsx('flex items-center gap-1 flex-wrap mt-1', className)} {...props}>
      {/* Existing Reactions */}
      <AnimatePresence>
        {visibleReactions.map(([emoji, data]) => (
          <ReactionButton
            key={emoji}
            emoji={emoji}
            count={data.count}
            users={data.users}
            hasUserReacted={data.hasUserReacted}
            isProcessing={isProcessing(message._id, emoji)}
            onClick={() => handleReactionClick(emoji)}
            compact={compact}
          />
        ))}
      </AnimatePresence>

      {/* Show More Button */}
      {!showAllReactions && hiddenCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAllReactions(true)}
          className="text-xs text-gray-400 hover:text-gray-300 px-2 py-1 h-auto"
        >
          +{hiddenCount} more
        </Button>
      )}

      {/* Show Less Button */}
      {showAllReactions && hiddenCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAllReactions(false)}
          className="text-xs text-gray-400 hover:text-gray-300 px-2 py-1 h-auto"
        >
          Show less
        </Button>
      )}

      {/* Add Reaction Button */}
      {showAddButton && (
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={clsx(
              'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
              compact ? 'w-6 h-6' : 'w-7 h-7'
            )}
          >
            <Plus className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
          </Button>

          {/* Emoji Picker */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                ref={emojiPickerRef}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute bottom-full left-0 mb-2 glass rounded-lg p-3 border border-gray-600/50 z-50 min-w-[200px]"
              >
                <div className="grid grid-cols-6 gap-2">
                  {EMOJI_REACTIONS.map((emoji) => {
                    const hasReacted = groupedReactions[emoji]?.hasUserReacted
                    const isProcessingEmoji = isProcessing(message._id, emoji)
                    
                    return (
                      <button
                        key={emoji}
                        onClick={() => handleAddReaction(emoji)}
                        disabled={isProcessingEmoji}
                        className={clsx(
                          'w-8 h-8 flex items-center justify-center rounded transition-all duration-200',
                          'hover:bg-white/10 active:scale-95',
                          hasReacted && 'bg-cyan-500/20 ring-1 ring-cyan-400/50',
                          isProcessingEmoji && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {emoji}
                      </button>
                    )
                  })}
                </div>
                
                <div className="mt-2 pt-2 border-t border-gray-600/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Smile className="w-4 h-4" />}
                    className="w-full text-sm text-gray-400"
                  >
                    More reactions
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

// Individual reaction button component
const ReactionButton = ({
  emoji,
  count,
  users = [],
  hasUserReacted = false,
  isProcessing = false,
  onClick,
  compact = false,
  className = '',
  ...props
}) => {
  const [showTooltip, setShowTooltip] = useState(false)

  // Format users list for tooltip
  const formatUsers = () => {
    if (users.length === 0) return ''
    if (users.length === 1) return users[0].name || 'Someone'
    if (users.length === 2) return `${users[0].name} and ${users[1].name}`
    if (users.length === 3) return `${users[0].name}, ${users[1].name} and ${users[2].name}`
    
    return `${users[0].name}, ${users[1].name} and ${users.length - 2} others`
  }

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        disabled={isProcessing}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={clsx(
          'flex items-center gap-1 rounded-full transition-all duration-200',
          'border border-gray-600/30 hover:border-gray-500/50',
          compact ? 'px-2 py-1' : 'px-2.5 py-1.5',
          hasUserReacted 
            ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-400' 
            : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300',
          isProcessing && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        <span className={compact ? 'text-sm' : 'text-base'}>
          {emoji}
        </span>
        <span className={clsx(
          'font-medium',
          compact ? 'text-xs' : 'text-sm'
        )}>
          {count}
        </span>
        
        {/* Processing indicator */}
        {isProcessing && (
          <div className={clsx(
            'animate-spin rounded-full border-2 border-transparent border-t-current',
            compact ? 'w-2 h-2' : 'w-3 h-3'
          )} />
        )}
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && users.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded border border-gray-600/50 z-50 whitespace-nowrap"
          >
            {formatUsers()} reacted with {emoji}
            
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Quick reactions bar for hovering over messages
export const QuickReactions = ({
  message,
  conversationId,
  onReactionSelect,
  className = '',
  ...props
}) => {
  const { toggleReaction, isProcessing } = useMessageReactions(conversationId)

  const handleQuickReaction = async (emoji) => {
    await toggleReaction(message._id, emoji)
    onReactionSelect?.(emoji)
  }

  const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡']

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={clsx(
        'flex items-center gap-1 glass rounded-full p-1 border border-gray-600/50',
        'backdrop-blur-sm',
        className
      )}
      {...props}
    >
      {quickEmojis.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleQuickReaction(emoji)}
          disabled={isProcessing(message._id, emoji)}
          className={clsx(
            'w-8 h-8 flex items-center justify-center rounded-full',
            'hover:bg-white/10 active:scale-90 transition-all duration-150',
            isProcessing(message._id, emoji) && 'opacity-50'
          )}
        >
          {emoji}
        </button>
      ))}
    </motion.div>
  )
}

// Reaction picker modal for full emoji selection
export const ReactionPickerModal = ({
  isOpen,
  onClose,
  onReactionSelect,
  message,
  conversationId,
  className = '',
  ...props
}) => {
  const { toggleReaction } = useMessageReactions(conversationId)

  const categories = {
    'Smileys & Emotion': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
    'People & Body': ['👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👌', '🤏', '👋', '🤚', '🖐️', '✋', '🖖'],
    'Objects': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️'],
  }

  const handleReactionClick = async (emoji) => {
    await toggleReaction(message._id, emoji)
    onReactionSelect?.(emoji)
    onClose?.()
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={clsx(
          'glass rounded-xl p-6 max-w-md max-h-96 overflow-y-auto',
          'border border-gray-600/50',
          className
        )}
        {...props}
      >
        <h3 className="text-lg font-semibold text-white mb-4">Add Reaction</h3>
        
        <div className="space-y-4">
          {Object.entries(categories).map(([category, emojis]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-gray-400 mb-2">{category}</h4>
              <div className="grid grid-cols-8 gap-2">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReactionClick(emoji)}
                    className="w-10 h-10 flex items-center justify-center rounded hover:bg-white/10 transition-colors text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default MessageReactions
