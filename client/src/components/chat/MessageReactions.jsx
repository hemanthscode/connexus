import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Smile } from 'lucide-react'
import { clsx } from 'clsx'
import Button from '../ui/Button.jsx'
import { useMessageReactions } from '@/hooks/useMessages.jsx'
import { useAuth } from '@/hooks/useAuth.jsx'
import { EMOJI_REACTIONS } from '@/utils/constants.js'

// Configuration constants
const REACTION_CONFIG = {
  MAX_VISIBLE: 6,
  QUICK_EMOJIS: ['👍', '❤️', '😂', '😮', '😢', '😡'],
  TOOLTIP_DELAY: 500,
  CATEGORIES: {
    'Smileys & Emotion': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
    'People & Body': ['👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👌', '🤏', '👋', '🤚', '🖐️', '✋', '🖖'],
    'Objects': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️'],
  }
}

const MessageReactions = ({
  message,
  conversationId,
  compact = false,
  showAddButton = true,
  maxReactions = REACTION_CONFIG.MAX_VISIBLE,
  className = '',
  ...props
}) => {
  const { toggleReaction, isProcessing } = useMessageReactions(conversationId)
  const { user } = useAuth()
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showAllReactions, setShowAllReactions] = useState(false)
  
  const emojiPickerRef = useRef(null)

  // Memoized grouped reactions
  const { groupedReactions, reactionEntries, visibleReactions, hiddenCount } = useMemo(() => {
    const grouped = message.reactions?.reduce((acc, reaction) => {
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

    const entries = Object.entries(grouped)
    const visible = showAllReactions ? entries : entries.slice(0, maxReactions)
    const hidden = entries.length - maxReactions

    return {
      groupedReactions: grouped,
      reactionEntries: entries,
      visibleReactions: visible,
      hiddenCount: hidden
    }
  }, [message.reactions, user?._id, showAllReactions, maxReactions])

  // Handle reaction click
  const handleReactionClick = useCallback(async (emoji) => {
    if (isProcessing(message._id, emoji)) return
    await toggleReaction(message._id, emoji)
  }, [toggleReaction, message._id, isProcessing])

  // Handle add reaction
  const handleAddReaction = useCallback((emoji) => {
    setShowEmojiPicker(false)
    handleReactionClick(emoji)
  }, [handleReactionClick])

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

  if (!reactionEntries.length && !showAddButton) {
    return null
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

      {/* Show More/Less Buttons */}
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
  const formatUsers = useCallback(() => {
    if (users.length === 0) return ''
    if (users.length === 1) return users[0].name || 'Someone'
    if (users.length === 2) return `${users[0].name} and ${users[1].name}`
    if (users.length === 3) return `${users[0].name}, ${users[1].name} and ${users[2].name}`
    
    return `${users[0].name}, ${users[1].name} and ${users.length - 2} others`
  }, [users])

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
        <span className={compact ? 'text-sm' : 'text-base'}>{emoji}</span>
        <span className={clsx('font-medium', compact ? 'text-xs' : 'text-sm')}>{count}</span>
        
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
            
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Quick reactions bar for hovering over messages
export const QuickReactions = ({ message, conversationId, onReactionSelect, className = '', ...props }) => {
  const { toggleReaction, isProcessing } = useMessageReactions(conversationId)

  const handleQuickReaction = useCallback(async (emoji) => {
    await toggleReaction(message._id, emoji)
    onReactionSelect?.(emoji)
  }, [toggleReaction, message._id, onReactionSelect])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={clsx(
        'flex items-center gap-1 glass rounded-full p-1 border border-gray-600/50 backdrop-blur-sm',
        className
      )}
      {...props}
    >
      {REACTION_CONFIG.QUICK_EMOJIS.map((emoji) => (
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

export default MessageReactions
