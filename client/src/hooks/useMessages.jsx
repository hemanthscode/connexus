import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useChat } from './useChat.jsx'
import { useAuth } from './useAuth.jsx'
import { useSocket } from './useSocket.jsx'
import { formatMessageTime, createDateSeparator } from '@/utils/formatters.js'
import { debounce, throttle } from '@/utils/helpers.js'
import { MESSAGE_STATUS } from '@/utils/constants.js'

/**
 * Hook for managing messages in a conversation with pagination and real-time updates
 */
export const useMessages = (conversationId, options = {}) => {
  const {
    pageSize = 50,
    autoLoadMore = true,
    autoMarkAsRead = true,
    includeDeleted = false,
    groupByDate = true,
  } = options

  const {
    getMessagesForConversation,
    loadMessages,
    loadMoreMessages,
    markAsRead,
    messagesLoading,
    hasMoreMessages,
    messagesPagination
  } = useChat()

  const { user } = useAuth()
  const { isConnected } = useSocket()

  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [visibleMessages, setVisibleMessages] = useState([])
  const [lastVisibleMessageId, setLastVisibleMessageId] = useState(null)
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true)
  
  const messagesEndRef = useRef(null)
  const containerRef = useRef(null)
  const lastScrollTop = useRef(0)

  // Get raw messages
  const rawMessages = useMemo(() => {
    return conversationId ? getMessagesForConversation(conversationId) : []
  }, [conversationId, getMessagesForConversation])

  // Process and filter messages
  const processedMessages = useMemo(() => {
    let messages = [...rawMessages]

    // Filter out deleted messages if not included
    if (!includeDeleted) {
      messages = messages.filter(msg => !msg.isDeleted)
    }

    // Sort messages by creation time
    messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

    // Add metadata to messages
    return messages.map((message, index) => {
      const prevMessage = messages[index - 1]
      const nextMessage = messages[index + 1]

      // Check if this message is from the same sender as previous
      const isSameSender = prevMessage && 
        prevMessage.sender._id === message.sender._id &&
        !prevMessage.isDeleted

      // Check if messages are close in time (within 2 minutes)
      const isCloseInTime = prevMessage &&
        (new Date(message.createdAt) - new Date(prevMessage.createdAt)) < 2 * 60 * 1000

      // Group consecutive messages from same sender
      const isGrouped = isSameSender && isCloseInTime

      // Determine if we should show avatar and name
      const showAvatar = !isGrouped || message.isDeleted
      const showName = showAvatar && message.sender._id !== user?._id

      // Check if user can edit/delete this message
      const canEdit = message.sender._id === user?._id && 
                     !message.isDeleted && 
                     message.type === 'text'

      const canDelete = message.sender._id === user?._id && 
                       !message.isDeleted

      // Format timestamp
      const formattedTime = formatMessageTime(message.createdAt)

      // Check if message is read by current user
      const isReadByUser = message.readBy?.some(r => r.user === user?._id) || 
                          message.sender._id === user?._id

      // Check if message is own message
      const isOwnMessage = message.sender._id === user?._id

      // Date separator
      const dateSeparator = groupByDate 
        ? createDateSeparator(message.createdAt, prevMessage?.createdAt)
        : null

      return {
        ...message,
        isGrouped,
        showAvatar,
        showName,
        canEdit,
        canDelete,
        formattedTime,
        isReadByUser,
        isOwnMessage,
        dateSeparator,
        index,
      }
    })
  }, [rawMessages, includeDeleted, user?._id, groupByDate]) // FIXED: Only include user._id, not entire user object

  // Update visible messages
  useEffect(() => {
    setVisibleMessages(processedMessages)
  }, [processedMessages])

  // Load initial messages - FIXED: Add proper dependencies and prevent infinite loop
  useEffect(() => {
    if (conversationId && rawMessages.length === 0 && !messagesLoading) {
      console.log('Loading initial messages for conversation:', conversationId)
      loadMessages(conversationId, 1, pageSize)
    }
  }, [conversationId]) // FIXED: Only depend on conversationId to prevent infinite loop

  // Auto-scroll to bottom for new messages
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      })
    }
  }, [])

  // Check if user is near bottom
  const isNearBottom = useCallback(() => {
    const container = containerRef.current
    if (!container) return true

    const { scrollTop, scrollHeight, clientHeight } = container
    return scrollHeight - scrollTop - clientHeight < 100
  }, [])

  // Auto-scroll effect - FIXED: Proper dependencies
  useEffect(() => {
    if (autoScrollEnabled && visibleMessages.length > 0) {
      const lastMessage = visibleMessages[visibleMessages.length - 1]
      const shouldAutoScroll = lastMessage?.isOwnMessage || isNearBottom()

      if (shouldAutoScroll) {
        scrollToBottom()
      }
    }
  }, [visibleMessages.length, autoScrollEnabled, scrollToBottom]) // FIXED: Removed isNearBottom from dependencies

  // Mark messages as read - FIXED: Debounce properly
  const debouncedMarkAsRead = useMemo(
    () => debounce((convId) => {
      if (convId && autoMarkAsRead && isConnected) {
        markAsRead(convId)
      }
    }, 1000),
    [autoMarkAsRead, isConnected, markAsRead]
  )

  useEffect(() => {
    if (!conversationId) return

    const unreadMessages = visibleMessages.filter(msg => 
      !msg.isReadByUser && !msg.isOwnMessage
    )

    if (unreadMessages.length > 0) {
      debouncedMarkAsRead(conversationId)
    }
  }, [conversationId, visibleMessages, debouncedMarkAsRead])

  // Load more messages
  const loadMore = useCallback(async () => {
    if (!conversationId || isLoadingMore || messagesLoading) return

    // FIXED: Use object syntax instead of Map
    const pagination = messagesPagination[conversationId]
    if (!pagination?.hasMore) return

    setIsLoadingMore(true)
    
    try {
      const container = containerRef.current
      const scrollTop = container?.scrollTop || 0
      const scrollHeight = container?.scrollHeight || 0

      await loadMoreMessages(conversationId)

      // Maintain scroll position after loading more messages
      if (container) {
        const newScrollHeight = container.scrollHeight
        const heightDiff = newScrollHeight - scrollHeight
        container.scrollTop = scrollTop + heightDiff
      }
    } finally {
      setIsLoadingMore(false)
    }
  }, [conversationId, isLoadingMore, messagesLoading, messagesPagination, loadMoreMessages])

  // Throttled scroll handler
  const handleScroll = useCallback(
    throttle((event) => {
      const container = event.target
      const scrollTop = container.scrollTop
      const scrollHeight = container.scrollHeight
      const clientHeight = container.clientHeight

      // Check if scrolled to top for loading more messages
      if (scrollTop < 100 && autoLoadMore) {
        loadMore()
      }

      // Update auto-scroll state based on scroll position
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
      setAutoScrollEnabled(isAtBottom)

      // Update last scroll position
      lastScrollTop.current = scrollTop

      // Update last visible message for read tracking
      const messageElements = container.querySelectorAll('[data-message-id]')
      for (let i = messageElements.length - 1; i >= 0; i--) {
        const element = messageElements[i]
        const rect = element.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        
        if (rect.bottom <= containerRect.bottom) {
          const messageId = element.dataset.messageId
          setLastVisibleMessageId(messageId)
          break
        }
      }
    }, 100),
    [autoLoadMore, loadMore]
  )

  // Scroll to specific message
  const scrollToMessage = useCallback((messageId, smooth = true) => {
    const element = document.querySelector(`[data-message-id="${messageId}"]`)
    if (element) {
      element.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'center'
      })
      
      // Highlight message briefly
      element.classList.add('highlighted')
      setTimeout(() => {
        element.classList.remove('highlighted')
      }, 2000)
    }
  }, [])

  // Get message statistics
  const messageStats = useMemo(() => {
    const stats = {
      total: visibleMessages.length,
      unread: 0,
      own: 0,
      others: 0,
      reactions: 0,
      attachments: 0,
    }

    visibleMessages.forEach(msg => {
      if (!msg.isReadByUser) stats.unread++
      if (msg.isOwnMessage) stats.own++
      else stats.others++
      if (msg.reactions?.length > 0) stats.reactions++
      if (msg.attachments?.length > 0) stats.attachments++
    })

    return stats
  }, [visibleMessages])

  // Find message by ID
  const findMessage = useCallback((messageId) => {
    return visibleMessages.find(msg => msg._id === messageId)
  }, [visibleMessages])

  // Get messages with status
  const getMessagesByStatus = useCallback((status) => {
    return visibleMessages.filter(msg => msg.status === status)
  }, [visibleMessages])

  // Check if has more messages to load
  const canLoadMore = useMemo(() => {
    // FIXED: Use object syntax instead of Map
    const pagination = messagesPagination[conversationId]
    return pagination?.hasMore && !isLoadingMore && !messagesLoading
  }, [conversationId, messagesPagination, isLoadingMore, messagesLoading])

  return {
    // Messages data
    messages: visibleMessages,
    messageCount: visibleMessages.length,
    
    // Loading states
    loading: messagesLoading,
    loadingMore: isLoadingMore,
    canLoadMore,
    
    // Scroll management
    containerRef,
    messagesEndRef,
    autoScrollEnabled,
    setAutoScrollEnabled,
    scrollToBottom,
    scrollToMessage,
    isNearBottom,
    
    // Event handlers
    onScroll: handleScroll,
    
    // Actions
    loadMore,
    refresh: () => conversationId && loadMessages(conversationId, 1, pageSize),
    
    // Utilities
    messageStats,
    findMessage,
    getMessagesByStatus,
    lastVisibleMessageId,
  }
}

// ... rest of the hooks remain the same
export const useMessageSelection = () => {
  const [selectedMessages, setSelectedMessages] = useState(new Set())
  const [selectionMode, setSelectionMode] = useState(false)

  const toggleSelection = useCallback((messageId) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      
      if (newSet.size === 0) {
        setSelectionMode(false)
      }
      
      return newSet
    })
  }, [])

  const startSelection = useCallback((messageId = null) => {
    setSelectionMode(true)
    if (messageId) {
      setSelectedMessages(new Set([messageId]))
    }
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedMessages(new Set())
    setSelectionMode(false)
  }, [])

  const selectAll = useCallback((messageIds) => {
    setSelectedMessages(new Set(messageIds))
    setSelectionMode(true)
  }, [])

  const selectRange = useCallback((startId, endId, messages) => {
    const startIndex = messages.findIndex(m => m._id === startId)
    const endIndex = messages.findIndex(m => m._id === endId)
    
    if (startIndex === -1 || endIndex === -1) return
    
    const start = Math.min(startIndex, endIndex)
    const end = Math.max(startIndex, endIndex)
    
    const rangeIds = messages
      .slice(start, end + 1)
      .map(m => m._id)
    
    setSelectedMessages(new Set(rangeIds))
    setSelectionMode(true)
  }, [])

  return {
    selectedMessages: Array.from(selectedMessages),
    selectionMode,
    selectedCount: selectedMessages.size,
    hasSelection: selectedMessages.size > 0,
    
    // Actions
    toggleSelection,
    startSelection,
    clearSelection,
    selectAll,
    selectRange,
    
    // Utilities
    isSelected: (messageId) => selectedMessages.has(messageId),
  }
}

export const useMessageReactions = (conversationId) => {
  const { addReaction, removeReaction, getMessagesForConversation } = useChat()
  const { user } = useAuth()
  const [processing, setProcessing] = useState(new Set())

  const toggleReaction = useCallback(async (messageId, emoji) => {
    const processingKey = `${messageId}-${emoji}`
    
    if (processing.has(processingKey)) return
    
    setProcessing(prev => new Set(prev).add(processingKey))
    
    try {
      // Get current message to check existing reactions
      const messages = getMessagesForConversation(conversationId)
      const message = messages.find(m => m._id === messageId)
      
      if (!message) return
      
      // Check if user already has this reaction
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

  const isProcessing = useCallback((messageId, emoji) => {
    return processing.has(`${messageId}-${emoji}`)
  }, [processing])

  return {
    toggleReaction,
    isProcessing,
  }
}

export default useMessages
