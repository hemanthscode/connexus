import { useState, useEffect, useCallback, useMemo } from 'react'
import { useChat } from './useChat.jsx'
import { useAuth } from './useAuth.jsx'
import { useOnlineUsers } from './useOnlineUsers.jsx'
import { formatConversationTime, isFromToday, isFromYesterday } from '@/utils/formatters.js'
import { debounce } from '@/utils/helpers.js'

/**
 * Hook for managing conversations list with filtering, sorting, and grouping
 */
export const useConversations = (options = {}) => {
  const {
    sortBy = 'lastMessage', // 'lastMessage', 'name', 'unread', 'participants'
    filterBy = 'all', // 'all', 'unread', 'groups', 'direct', 'archived', 'pinned'
    groupBy = null, // null, 'type', 'status', 'date'
    searchQuery = '',
    limit = 50
  } = options

  const {
    conversations,
    conversationsLoading,
    conversationsError,
    loadConversations,
    setActiveConversation,
    activeConversationId,
    formatConversationName
  } = useChat()

  const { user } = useAuth()
  const { getUserOnlineStatus } = useOnlineUsers()

  const [localSearch, setLocalSearch] = useState(searchQuery)
  const [refreshing, setRefreshing] = useState(false)

  // Process conversations with additional metadata
  const processedConversations = useMemo(() => {
    return conversations.map(conversation => {
      // Get conversation display name
      const displayName = formatConversationName(conversation, user?._id)
      
      // Get online status for direct conversations
      let isOnline = false
      let otherParticipant = null
      
      if (conversation.type === 'direct' && conversation.participants) {
        otherParticipant = conversation.participants.find(
          p => p.user._id !== user?._id
        )
        
        if (otherParticipant) {
          const status = getUserOnlineStatus(otherParticipant.user._id)
          isOnline = status === 'online'
        }
      }

      // Format last message time
      const lastMessageTime = conversation.lastMessage?.timestamp 
        ? formatConversationTime(conversation.lastMessage.timestamp)
        : ''

      // Calculate conversation metadata
      const participantCount = conversation.participants?.length || 0
      const unreadCount = conversation.unreadCount || 0
      const hasUnread = unreadCount > 0
      
      // Determine conversation status
      let status = 'normal'
      if (conversation.isArchived) status = 'archived'
      else if (conversation.isPinned) status = 'pinned'
      else if (hasUnread) status = 'unread'

      return {
        ...conversation,
        displayName,
        isOnline,
        otherParticipant: otherParticipant?.user || null,
        lastMessageTime,
        participantCount,
        unreadCount,
        hasUnread,
        status,
        isActive: conversation._id === activeConversationId,
        lastActivity: conversation.lastMessage?.timestamp || conversation.createdAt,
      }
    })
  }, [conversations, user, getUserOnlineStatus, formatConversationName, activeConversationId])

  // Filter conversations
  const filteredConversations = useMemo(() => {
    let filtered = processedConversations

    // Apply filter
    switch (filterBy) {
      case 'unread':
        filtered = filtered.filter(c => c.hasUnread)
        break
      case 'groups':
        filtered = filtered.filter(c => c.type === 'group')
        break
      case 'direct':
        filtered = filtered.filter(c => c.type === 'direct')
        break
      case 'archived':
        filtered = filtered.filter(c => c.isArchived)
        break
      case 'pinned':
        filtered = filtered.filter(c => c.isPinned)
        break
      case 'online':
        filtered = filtered.filter(c => c.isOnline)
        break
      default:
        // 'all' - no additional filtering for archived conversations
        filtered = filtered.filter(c => !c.isArchived)
    }

    // Apply search
    if (localSearch.trim()) {
      const query = localSearch.toLowerCase()
      filtered = filtered.filter(conversation => {
        // Search by display name
        if (conversation.displayName.toLowerCase().includes(query)) return true
        
        // Search by last message content
        if (conversation.lastMessage?.content?.toLowerCase().includes(query)) return true
        
        // Search by participant names (for groups)
        if (conversation.type === 'group' && conversation.participants) {
          return conversation.participants.some(p => 
            p.user?.name?.toLowerCase().includes(query)
          )
        }
        
        return false
      })
    }

    return filtered.slice(0, limit)
  }, [processedConversations, filterBy, localSearch, limit])

  // Sort conversations
  const sortedConversations = useMemo(() => {
    const sorted = [...filteredConversations]

    sorted.sort((a, b) => {
      // Always put pinned conversations first
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1

      switch (sortBy) {
        case 'name':
          return a.displayName.localeCompare(b.displayName)
          
        case 'unread':
          if (a.unreadCount !== b.unreadCount) {
            return b.unreadCount - a.unreadCount
          }
          // Fall through to lastMessage sort for equal unread counts
          
        case 'lastMessage':
        default:
          const aTime = new Date(a.lastActivity).getTime()
          const bTime = new Date(b.lastActivity).getTime()
          return bTime - aTime
          
        case 'participants':
          return b.participantCount - a.participantCount
          
        case 'online':
          if (a.isOnline && !b.isOnline) return -1
          if (!a.isOnline && b.isOnline) return 1
          // Fall through to lastMessage for equal online status
          return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      }
    })

    return sorted
  }, [filteredConversations, sortBy])

  // Group conversations if requested
  const groupedConversations = useMemo(() => {
    if (!groupBy) return { all: sortedConversations }

    const groups = {}

    switch (groupBy) {
      case 'type':
        groups.direct = sortedConversations.filter(c => c.type === 'direct')
        groups.groups = sortedConversations.filter(c => c.type === 'group')
        break
        
      case 'status':
        groups.unread = sortedConversations.filter(c => c.hasUnread)
        groups.read = sortedConversations.filter(c => !c.hasUnread)
        break
        
      case 'date':
        const today = []
        const yesterday = []
        const thisWeek = []
        const older = []
        
        sortedConversations.forEach(conversation => {
          const lastActivity = conversation.lastActivity
          if (!lastActivity) {
            older.push(conversation)
            return
          }
          
          if (isFromToday(lastActivity)) {
            today.push(conversation)
          } else if (isFromYesterday(lastActivity)) {
            yesterday.push(conversation)
          } else {
            const daysSince = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
            if (daysSince <= 7) {
              thisWeek.push(conversation)
            } else {
              older.push(conversation)
            }
          }
        })
        
        if (today.length) groups.today = today
        if (yesterday.length) groups.yesterday = yesterday
        if (thisWeek.length) groups.thisWeek = thisWeek
        if (older.length) groups.older = older
        break
        
      default:
        groups.all = sortedConversations
    }

    return groups
  }, [sortedConversations, groupBy])

  // Debounced search
  const debouncedSetSearch = useCallback(
    debounce((query) => {
      setLocalSearch(query)
    }, 300),
    []
  )

  // Refresh conversations
  const refreshConversations = useCallback(async () => {
    setRefreshing(true)
    try {
      await loadConversations(true)
    } finally {
      setRefreshing(false)
    }
  }, [loadConversations])

  // Select conversation
  const selectConversation = useCallback((conversationId) => {
    setActiveConversation(conversationId)
  }, [setActiveConversation])

  // Get conversation stats
  const stats = useMemo(() => {
    const totalUnread = processedConversations.reduce(
      (sum, conv) => sum + conv.unreadCount, 0
    )
    
    const counts = {
      total: processedConversations.length,
      unread: processedConversations.filter(c => c.hasUnread).length,
      direct: processedConversations.filter(c => c.type === 'direct').length,
      groups: processedConversations.filter(c => c.type === 'group').length,
      archived: processedConversations.filter(c => c.isArchived).length,
      online: processedConversations.filter(c => c.isOnline).length,
      totalUnreadMessages: totalUnread,
    }
    
    return counts
  }, [processedConversations])

  return {
    // Conversations data
    conversations: sortedConversations,
    groupedConversations: groupBy ? groupedConversations : null,
    processedConversations,
    
    // State
    loading: conversationsLoading,
    refreshing,
    error: conversationsError,
    
    // Search
    searchQuery: localSearch,
    setSearchQuery: debouncedSetSearch,
    
    // Actions
    refresh: refreshConversations,
    selectConversation,
    
    // Stats
    stats,
    
    // Active conversation
    activeConversationId,
    activeConversation: sortedConversations.find(c => c._id === activeConversationId) || null,
  }
}

/**
 * Hook for managing conversation list UI state
 */
export const useConversationListUI = () => {
  const [selectedConversations, setSelectedConversations] = useState(new Set())
  const [selectionMode, setSelectionMode] = useState(false)
  const [contextMenu, setContextMenu] = useState({
    open: false,
    conversationId: null,
    position: { x: 0, y: 0 }
  })

  // Toggle conversation selection
  const toggleSelection = useCallback((conversationId) => {
    setSelectedConversations(prev => {
      const newSet = new Set(prev)
      if (newSet.has(conversationId)) {
        newSet.delete(conversationId)
      } else {
        newSet.add(conversationId)
      }
      
      // Exit selection mode if no conversations selected
      if (newSet.size === 0) {
        setSelectionMode(false)
      }
      
      return newSet
    })
  }, [])

  // Select all conversations
  const selectAll = useCallback((conversationIds) => {
    setSelectedConversations(new Set(conversationIds))
    setSelectionMode(true)
  }, [])

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedConversations(new Set())
    setSelectionMode(false)
  }, [])

  // Enter selection mode
  const enterSelectionMode = useCallback((conversationId = null) => {
    setSelectionMode(true)
    if (conversationId) {
      setSelectedConversations(new Set([conversationId]))
    }
  }, [])

  // Show context menu
  const showContextMenu = useCallback((conversationId, event) => {
    event.preventDefault()
    setContextMenu({
      open: true,
      conversationId,
      position: { x: event.clientX, y: event.clientY }
    })
  }, [])

  // Hide context menu
  const hideContextMenu = useCallback(() => {
    setContextMenu({
      open: false,
      conversationId: null,
      position: { x: 0, y: 0 }
    })
  }, [])

  return {
    // Selection state
    selectedConversations: Array.from(selectedConversations),
    selectionMode,
    hasSelection: selectedConversations.size > 0,
    selectionCount: selectedConversations.size,
    
    // Selection actions
    toggleSelection,
    selectAll,
    clearSelection,
    enterSelectionMode,
    
    // Context menu
    contextMenu,
    showContextMenu,
    hideContextMenu,
    
    // Utilities
    isSelected: (conversationId) => selectedConversations.has(conversationId),
  }
}

/**
 * Hook for conversation keyboard navigation
 */
export const useConversationKeyboard = (conversations) => {
  const { selectConversation, activeConversationId } = useChat()
  const [focusedIndex, setFocusedIndex] = useState(0)

  // Find active conversation index
  useEffect(() => {
    if (activeConversationId) {
      const index = conversations.findIndex(c => c._id === activeConversationId)
      if (index !== -1) {
        setFocusedIndex(index)
      }
    }
  }, [activeConversationId, conversations])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event) => {
    if (conversations.length === 0) return

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : conversations.length - 1
        )
        break
        
      case 'ArrowDown':
        event.preventDefault()
        setFocusedIndex(prev => 
          prev < conversations.length - 1 ? prev + 1 : 0
        )
        break
        
      case 'Enter':
        event.preventDefault()
        if (conversations[focusedIndex]) {
          selectConversation(conversations[focusedIndex]._id)
        }
        break
        
      case 'Escape':
        // Could be used to clear selection or close modals
        break
    }
  }, [conversations, focusedIndex, selectConversation])

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    focusedConversation: conversations[focusedIndex] || null
  }
}

export default useConversations
