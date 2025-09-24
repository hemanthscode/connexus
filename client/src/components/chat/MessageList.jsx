import { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ArrowDown } from 'lucide-react'
import { clsx } from 'clsx'
import MessageBubble, { SystemMessage, DateSeparator, MessagePlaceholder } from './MessageBubble.jsx'
import TypingIndicator from './TypingIndicator.jsx'
import Button from '../ui/Button.jsx'
import { useMessages, useMessageSelection } from '@/hooks/useMessages.jsx'
import { useAuth } from '@/hooks/useAuth.jsx'
import { formatDate, isFromToday } from '@/utils/formatters.js'
import { throttle } from '@/utils/helpers.js'

const MessageList = ({
  conversationId,
  onReply,
  onEdit,
  onPin,
  onForward,
  showScrollToBottom = true,
  className = '',
  ...props
}) => {
  const { user } = useAuth()
  const {
    messages,
    loading,
    loadingMore,
    canLoadMore,
    containerRef,
    messagesEndRef,
    autoScrollEnabled,
    setAutoScrollEnabled,
    scrollToBottom,
    scrollToMessage,
    isNearBottom,
    onScroll,
    loadMore
  } = useMessages(conversationId, {
    pageSize: 50,
    autoLoadMore: true,
    autoMarkAsRead: true,
    includeDeleted: false,
    groupByDate: true
  })

  const {
    selectedMessages,
    selectionMode,
    toggleSelection,
    clearSelection
  } = useMessageSelection()

  const [showScrollButton, setShowScrollButton] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [jumpToMessageId, setJumpToMessageId] = useState(null)

  // Process messages with date separators and grouping
  const processedMessages = useMemo(() => {
    const processed = []
    let currentDate = null

    messages.forEach((message, index) => {
      const messageDate = new Date(message.createdAt)
      const dateString = formatDate(messageDate)

      // Add date separator
      if (!currentDate || !isFromToday(currentDate, messageDate)) {
        processed.push({
          id: `date-${dateString}`,
          type: 'date-separator',
          date: dateString,
          originalDate: messageDate
        })
        currentDate = messageDate
      }

      // Determine if message should show avatar/name
      const prevMessage = messages[index - 1]
      const nextMessage = messages[index + 1]

      const showAvatar = !message.isGrouped || message.type === 'system'
      const showName = showAvatar && message.sender._id !== user?._id && message.type !== 'system'

      processed.push({
        ...message,
        showAvatar,
        showName,
        isSelected: selectedMessages.includes(message._id)
      })
    })

    return processed
  }, [messages, user, selectedMessages])

  // Handle scroll to bottom button visibility
  useEffect(() => {
    const handleScroll = throttle(() => {
      const isNear = isNearBottom()
      setShowScrollButton(!isNear)
      setAutoScrollEnabled(isNear)
      
      // Count unread messages below viewport
      if (!isNear) {
        setUnreadCount(0) // Simplified for now
      } else {
        setUnreadCount(0)
      }
    }, 100)

    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [isNearBottom, setAutoScrollEnabled, containerRef])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!selectionMode) return

      switch (event.key) {
        case 'Escape':
          clearSelection()
          break
        case 'Delete':
        case 'Backspace':
          if (selectedMessages.length > 0) {
            event.preventDefault()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectionMode, selectedMessages, clearSelection])

  // Jump to specific message
  const handleJumpToMessage = useCallback((messageId) => {
    setJumpToMessageId(messageId)
    scrollToMessage(messageId)
    
    // Clear highlight after animation
    setTimeout(() => {
      setJumpToMessageId(null)
    }, 3000)
  }, [scrollToMessage])

  // Handle load more messages
  const handleLoadMore = useCallback(async () => {
    if (canLoadMore && !loadingMore) {
      await loadMore()
    }
  }, [canLoadMore, loadingMore, loadMore])

  // Render message item
  const renderMessage = useCallback((item, index) => {
    if (item.type === 'date-separator') {
      return (
        <DateSeparator
          key={item.id}
          date={item.date}
        />
      )
    }

    if (item.type === 'system') {
      return (
        <SystemMessage
          key={item._id}
          message={item}
        />
      )
    }

    return (
      <MessageBubble
        key={item._id}
        message={item}
        conversationId={conversationId}
        showAvatar={item.showAvatar}
        showName={item.showName}
        isGrouped={item.isGrouped}
        isSelected={item.isSelected}
        onSelect={selectionMode ? toggleSelection : undefined}
        onReply={onReply}
        onEdit={onEdit}
        onPin={onPin}
        onForward={onForward}
        className={clsx(
          jumpToMessageId === item._id && 'bg-yellow-500/20 rounded-lg transition-all duration-1000'
        )}
      />
    )
  }, [conversationId, selectionMode, toggleSelection, onReply, onEdit, onPin, onForward, jumpToMessageId])

  // Handle scroll to bottom
  const handleScrollToBottom = useCallback(() => {
    scrollToBottom(true)
    setShowScrollButton(false)
    setUnreadCount(0)
  }, [scrollToBottom])

  return (
    <div className={clsx('flex flex-col h-full relative', className)} {...props}>
      {/* Load More Button */}
      <AnimatePresence>
        {canLoadMore && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex justify-center p-4"
          >
            <Button
              variant="secondary"
              onClick={handleLoadMore}
              loading={loadingMore}
              disabled={loadingMore}
            >
              Load More Messages
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Container */}
      <div
        ref={containerRef}
        onScroll={onScroll}
        className={clsx(
          'flex-1 overflow-y-auto px-4 py-2',
          'scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent'
        )}
      >
        {loading && messages.length === 0 ? (
          // Initial loading state
          <div className="space-y-4">
            {Array.from({ length: 10 }, (_, i) => (
              <MessagePlaceholder key={i} isOwn={i % 3 === 0} />
            ))}
          </div>
        ) : (
          // Regular rendering - removed virtualization for now
          <div className="space-y-0">
            {processedMessages.map((item, index) => renderMessage(item, index))}
            
            {/* Typing Indicator */}
            <TypingIndicator conversationId={conversationId} />
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} className="h-0" />
      </div>

      {/* Scroll to Bottom Button */}
      <AnimatePresence>
        {showScrollButton && showScrollToBottom && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-4 right-4 z-10"
          >
            <Button
              variant="primary"
              size="icon"
              onClick={handleScrollToBottom}
              className="w-12 h-12 rounded-full shadow-lg hover:shadow-neon-cyan"
            >
              {unreadCount > 0 ? (
                <div className="relative">
                  <ChevronDown className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  </div>
                </div>
              ) : (
                <ArrowDown className="w-5 h-5" />
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection Mode Toolbar */}
      <AnimatePresence>
        {selectionMode && selectedMessages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-0 left-0 right-0 glass border-t border-gray-600/50 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-white">
                  {selectedMessages.length} message{selectedMessages.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {/* Handle forward */}}
                >
                  Forward
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {/* Handle delete */}}
                >
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Empty state component
export const EmptyMessageList = ({
  conversationName = 'conversation',
  onStartChat,
  className = '',
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={clsx(
        'flex-1 flex items-center justify-center',
        className
      )}
      {...props}
    >
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-600/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">💬</span>
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-2">
          Start the conversation
        </h3>
        
        <p className="text-gray-400 mb-6">
          This is the beginning of your conversation with {conversationName}. 
          Send a message to get started!
        </p>
        
        {onStartChat && (
          <Button
            variant="primary"
            onClick={onStartChat}
          >
            Send your first message
          </Button>
        )}
      </div>
    </motion.div>
  )
}

// Message search results component
export const MessageSearchResults = ({
  results = [],
  query = '',
  onResultClick,
  onClose,
  className = '',
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={clsx(
        'absolute top-0 left-0 right-0 glass border-b border-gray-600/50 z-20',
        className
      )}
      {...props}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-white">
            Search results for "{query}"
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
        
        <div className="max-h-64 overflow-y-auto space-y-2">
          {results.length > 0 ? (
            results.map((result, index) => (
              <motion.button
                key={result._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onResultClick?.(result)}
                className="w-full text-left glass rounded-lg p-3 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={result.sender.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(result.sender.name || 'U')}&size=32`}
                    alt={result.sender.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white truncate">
                        {result.sender.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(result.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 truncate">
                      {result.content}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No messages found for "{query}"</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default MessageList
