import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useChat } from './useChat.jsx'
import { useAuth } from './useAuth.jsx'
import { useSocket } from './useSocket.jsx'
import { formatMessageTime, createDateSeparator } from '@/utils/formatters.js'
import { debounce, throttle } from '@/utils/helpers.js'

// Configuration constants
const DEFAULT_OPTIONS = {
  pageSize: 50,
  autoLoadMore: true,
  autoMarkAsRead: true,
  includeDeleted: false,
  groupByDate: true,
}

const SCROLL_CONFIG = {
  NEAR_BOTTOM_THRESHOLD: 100,
  LOAD_MORE_THRESHOLD: 100,
  AUTO_SCROLL_THRESHOLD: 50,
}

export const useMessages = (conversationId, options = {}) => {
  const config = { ...DEFAULT_OPTIONS, ...options }
  
  const {
    getMessagesForConversation,
    loadMessages,
    loadMoreMessages,
    markAsRead,
    messagesLoading,
    messagesPagination
  } = useChat()

  const { user } = useAuth()
  const { isConnected } = useSocket()

  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [lastVisibleMessageId, setLastVisibleMessageId] = useState(null)
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true)
  
  const messagesEndRef = useRef(null)
  const containerRef = useRef(null)
  const lastScrollTop = useRef(0)

  // Get and process messages with memoization - FIXED: Handle undefined messages
  const processedMessages = useMemo(() => {
    if (!conversationId) return []

    // FIXED: Ensure messages is always an array, never undefined
    let messages = getMessagesForConversation(conversationId) || []
    
    // Ensure messages is an array (additional safety check)
    if (!Array.isArray(messages)) {
      console.warn('getMessagesForConversation returned non-array:', messages)
      messages = []
    }
    
    // Filter deleted messages
    if (!config.includeDeleted) {
      messages = messages.filter(msg => msg && !msg.isDeleted)
    }

    // Sort by creation time
    messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

    // Process with metadata
    return messages.map((message, index) => {
      if (!message) return null // Skip null/undefined messages
      
      const prevMessage = messages[index - 1]
      const isSameSender = prevMessage?.sender?._id === message.sender?._id && !prevMessage.isDeleted
      const isCloseInTime = prevMessage && 
        (new Date(message.createdAt) - new Date(prevMessage.createdAt)) < 2 * 60 * 1000
      
      const isGrouped = isSameSender && isCloseInTime
      const isOwnMessage = message.sender?._id === user?._id

      return {
        ...message,
        isGrouped,
        showAvatar: !isGrouped || message.isDeleted,
        showName: (!isGrouped || message.isDeleted) && !isOwnMessage,
        canEdit: isOwnMessage && !message.isDeleted && message.type === 'text',
        canDelete: isOwnMessage && !message.isDeleted,
        formattedTime: formatMessageTime(message.createdAt),
        isReadByUser: message.readBy?.some(r => r.user === user?._id) || isOwnMessage,
        isOwnMessage,
        dateSeparator: config.groupByDate ? createDateSeparator(message.createdAt, prevMessage?.createdAt) : null,
        index,
      }
    }).filter(Boolean) // Remove any null messages
  }, [conversationId, getMessagesForConversation, config.includeDeleted, config.groupByDate, user?._id])

  // Load initial messages
  useEffect(() => {
    if (conversationId && processedMessages.length === 0 && !messagesLoading) {
      loadMessages(conversationId, 1, config.pageSize)
    }
  }, [conversationId])

  // Scroll utilities with memoization
  const scrollHelpers = useMemo(() => ({
    scrollToBottom: (smooth = true) => {
      messagesEndRef.current?.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      })
    },

    isNearBottom: () => {
      const container = containerRef.current
      if (!container) return true
      
      const { scrollTop, scrollHeight, clientHeight } = container
      return scrollHeight - scrollTop - clientHeight < SCROLL_CONFIG.NEAR_BOTTOM_THRESHOLD
    },

    scrollToMessage: (messageId, smooth = true) => {
      const element = document.querySelector(`[data-message-id="${messageId}"]`)
      if (element) {
        element.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' })
        element.classList.add('highlighted')
        setTimeout(() => element.classList.remove('highlighted'), 2000)
      }
    },
  }), [])

  // Auto-scroll for new messages
  useEffect(() => {
    if (autoScrollEnabled && processedMessages.length > 0) {
      const lastMessage = processedMessages[processedMessages.length - 1]
      const shouldAutoScroll = lastMessage?.isOwnMessage || scrollHelpers.isNearBottom()

      if (shouldAutoScroll) {
        scrollHelpers.scrollToBottom()
      }
    }
  }, [processedMessages.length, autoScrollEnabled])

  // Mark as read with debouncing
  const debouncedMarkAsRead = useMemo(() => 
    debounce((convId) => {
      if (convId && config.autoMarkAsRead && isConnected) {
        markAsRead(convId)
      }
    }, 1000),
    [config.autoMarkAsRead, isConnected, markAsRead]
  )

  useEffect(() => {
    if (!conversationId) return

    const unreadMessages = processedMessages.filter(msg => 
      !msg.isReadByUser && !msg.isOwnMessage
    )

    if (unreadMessages.length > 0) {
      debouncedMarkAsRead(conversationId)
    }
  }, [conversationId, processedMessages, debouncedMarkAsRead])

  // Load more messages
  const loadMore = useCallback(async () => {
    if (!conversationId || isLoadingMore || messagesLoading) return

    const pagination = messagesPagination?.[conversationId]
    if (!pagination?.hasMore) return

    setIsLoadingMore(true)
    
    try {
      const container = containerRef.current
      const scrollTop = container?.scrollTop || 0
      const scrollHeight = container?.scrollHeight || 0

      await loadMoreMessages(conversationId)

      // Maintain scroll position
      if (container) {
        const newScrollHeight = container.scrollHeight
        container.scrollTop = scrollTop + (newScrollHeight - scrollHeight)
      }
    } finally {
      setIsLoadingMore(false)
    }
  }, [conversationId, isLoadingMore, messagesLoading, messagesPagination, loadMoreMessages])

  // Throttled scroll handler
  const handleScroll = useCallback(
    throttle((event) => {
      const container = event.target
      const { scrollTop, scrollHeight, clientHeight } = container

      // Load more at top
      if (scrollTop < SCROLL_CONFIG.LOAD_MORE_THRESHOLD && config.autoLoadMore) {
        loadMore()
      }

      // Update auto-scroll state
      const isAtBottom = scrollHeight - scrollTop - clientHeight < SCROLL_CONFIG.AUTO_SCROLL_THRESHOLD
      setAutoScrollEnabled(isAtBottom)

      lastScrollTop.current = scrollTop

      // Track visible message for read status
      const messageElements = container.querySelectorAll('[data-message-id]')
      for (let i = messageElements.length - 1; i >= 0; i--) {
        const element = messageElements[i]
        const rect = element.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        
        if (rect.bottom <= containerRect.bottom) {
          setLastVisibleMessageId(element.dataset.messageId)
          break
        }
      }
    }, 100),
    [config.autoLoadMore, loadMore]
  )

  // Message statistics
  const messageStats = useMemo(() => ({
    total: processedMessages.length,
    unread: processedMessages.filter(m => !m.isReadByUser).length,
    own: processedMessages.filter(m => m.isOwnMessage).length,
    others: processedMessages.filter(m => !m.isOwnMessage).length,
    reactions: processedMessages.filter(m => m.reactions?.length > 0).length,
    attachments: processedMessages.filter(m => m.attachments?.length > 0).length,
  }), [processedMessages])

  // Utilities - FIXED: Add safe message lookup
  const utilities = useMemo(() => ({
    findMessage: (messageId) => processedMessages.find(msg => msg?._id === messageId),
    getMessagesByStatus: (status) => processedMessages.filter(msg => msg?.status === status),
    canLoadMore: messagesPagination?.[conversationId]?.hasMore && !isLoadingMore && !messagesLoading,
  }), [processedMessages, messagesPagination, conversationId, isLoadingMore, messagesLoading])

  return {
    // Messages data
    messages: processedMessages,
    messageCount: processedMessages.length,
    
    // Loading states
    loading: messagesLoading,
    loadingMore: isLoadingMore,
    canLoadMore: utilities.canLoadMore,
    
    // Scroll management
    containerRef,
    messagesEndRef,
    autoScrollEnabled,
    setAutoScrollEnabled,
    ...scrollHelpers,
    
    // Event handlers
    onScroll: handleScroll,
    
    // Actions
    loadMore,
    refresh: () => conversationId && loadMessages(conversationId, 1, config.pageSize),
    
    // Utilities
    messageStats,
    ...utilities,
    lastVisibleMessageId,
  }
}

// Simplified selection hook
export const useMessageSelection = () => {
  const [selectedMessages, setSelectedMessages] = useState(new Set())
  const [selectionMode, setSelectionMode] = useState(false)

  const actions = useMemo(() => ({
    toggleSelection: (messageId) => {
      setSelectedMessages(prev => {
        const newSet = new Set(prev)
        if (newSet.has(messageId)) {
          newSet.delete(messageId)
        } else {
          newSet.add(messageId)
        }
        
        if (newSet.size === 0) setSelectionMode(false)
        return newSet
      })
    },

    startSelection: (messageId = null) => {
      setSelectionMode(true)
      if (messageId) setSelectedMessages(new Set([messageId]))
    },

    clearSelection: () => {
      setSelectedMessages(new Set())
      setSelectionMode(false)
    },

    selectAll: (messageIds) => {
      setSelectedMessages(new Set(messageIds))
      setSelectionMode(true)
    },

    selectRange: (startId, endId, messages) => {
      const startIndex = messages.findIndex(m => m._id === startId)
      const endIndex = messages.findIndex(m => m._id === endId)
      
      if (startIndex === -1 || endIndex === -1) return
      
      const start = Math.min(startIndex, endIndex)
      const end = Math.max(startIndex, endIndex)
      
      const rangeIds = messages.slice(start, end + 1).map(m => m._id)
      setSelectedMessages(new Set(rangeIds))
      setSelectionMode(true)
    },
  }), [])

  return {
    selectedMessages: Array.from(selectedMessages),
    selectionMode,
    selectedCount: selectedMessages.size,
    hasSelection: selectedMessages.size > 0,
    ...actions,
    isSelected: (messageId) => selectedMessages.has(messageId),
  }
}

// Optimized reactions hook - FIXED: Add safety checks
export const useMessageReactions = (conversationId) => {
  const { addReaction, removeReaction, getMessagesForConversation } = useChat()
  const { user } = useAuth()
  const [processing, setProcessing] = useState(new Set())

  const toggleReaction = useCallback(async (messageId, emoji) => {
    const processingKey = `${messageId}-${emoji}`
    
    if (processing.has(processingKey)) return
    
    setProcessing(prev => new Set(prev).add(processingKey))
    
    try {
      const messages = getMessagesForConversation(conversationId) || []
      const message = messages.find(m => m?._id === messageId)
      
      if (!message) return
      
      const existingReaction = message.reactions?.find(r => 
        r.user === user?._id && r.emoji === emoji
      )
      
      if (existingReaction) {
        await removeReaction(messageId, emoji)
      } else {
        await addReaction(messageId, emoji)
      }
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev)
        newSet.delete(processingKey)
        return newSet
      })
    }
  }, [conversationId, addReaction, removeReaction, user?._id, processing, getMessagesForConversation])

  return {
    toggleReaction,
    isProcessing: (messageId, emoji) => processing.has(`${messageId}-${emoji}`),
  }
}

export default useMessages
