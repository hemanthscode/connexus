import { useState, useEffect, useCallback, useMemo } from 'react'
import { useChat } from './useChat.jsx'
import { useAuth } from './useAuth.jsx'
import { useOnlineUsers } from './useOnlineUsers.jsx'
import { formatConversationTime, isFromToday, isFromYesterday } from '@/utils/formatters.js'
import { debounce } from '@/utils/helpers.js'

// Default configuration
const DEFAULT_CONFIG = {
  sortBy: 'lastMessage', // 'lastMessage', 'name', 'unread', 'participants'
  filterBy: 'all', // 'all', 'unread', 'groups', 'direct', 'archived', 'pinned'
  groupBy: null, // null, 'type', 'status', 'date'
  searchQuery: '',
  limit: 50
}

export const useConversations = (options = {}) => {
  const config = { ...DEFAULT_CONFIG, ...options }
  
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

  const [localSearch, setLocalSearch] = useState(config.searchQuery)
  const [refreshing, setRefreshing] = useState(false)

  // Process conversations with metadata
  const processedConversations = useMemo(() => {
    return conversations.map(conversation => {
      const displayName = formatConversationName(conversation, user?._id)
      
      // Get online status for direct conversations
      let isOnline = false
      let otherParticipant = null
      
      if (conversation.type === 'direct' && conversation.participants) {
        otherParticipant = conversation.participants.find(p => p.user._id !== user?._id)
        if (otherParticipant) {
          isOnline = getUserOnlineStatus(otherParticipant.user._id) === 'online'
        }
      }

      const unreadCount = conversation.unreadCount || 0
      const hasUnread = unreadCount > 0

      return {
        ...conversation,
        displayName,
        isOnline,
        otherParticipant: otherParticipant?.user || null,
        lastMessageTime: conversation.lastMessage?.timestamp 
          ? formatConversationTime(conversation.lastMessage.timestamp)
          : '',
        participantCount: conversation.participants?.length || 0,
        unreadCount,
        hasUnread,
        status: conversation.isArchived ? 'archived' 
          : conversation.isPinned ? 'pinned' 
          : hasUnread ? 'unread' : 'normal',
        isActive: conversation._id === activeConversationId,
        lastActivity: conversation.lastMessage?.timestamp || conversation.createdAt,
      }
    })
  }, [conversations, user?._id, getUserOnlineStatus, formatConversationName, activeConversationId])

  // Filter, sort, and group conversations
  const { filteredConversations, groupedConversations } = useMemo(() => {
    let filtered = processedConversations

    // Apply filters
    const filters = {
      unread: (c) => c.hasUnread,
      groups: (c) => c.type === 'group',
      direct: (c) => c.type === 'direct',
      archived: (c) => c.isArchived,
      pinned: (c) => c.isPinned,
      online: (c) => c.isOnline,
      all: (c) => !c.isArchived, // Default excludes archived
    }

    const filterFn = filters[config.filterBy] || filters.all
    filtered = filtered.filter(filterFn)

    // Apply search
    if (localSearch.trim()) {
      const query = localSearch.toLowerCase()
      filtered = filtered.filter(conversation => {
        return conversation.displayName.toLowerCase().includes(query) ||
               conversation.lastMessage?.content?.toLowerCase().includes(query) ||
               (conversation.type === 'group' && conversation.participants?.some(p => 
                 p.user?.name?.toLowerCase().includes(query)
               ))
      })
    }

    // Sort conversations
    filtered.sort((a, b) => {
      // Pinned first
      if (a.isPinned !== b.isPinned) return b.isPinned - a.isPinned

      switch (config.sortBy) {
        case 'name':
          return a.displayName.localeCompare(b.displayName)
        case 'unread':
          return b.unreadCount - a.unreadCount || 
                 new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
        case 'participants':
          return b.participantCount - a.participantCount
        case 'online':
          return (b.isOnline - a.isOnline) || 
                 new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
        default: // lastMessage
          return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      }
    })

    // Limit results
    const limitedFiltered = filtered.slice(0, config.limit)

    // Group conversations if requested
    let grouped = null
    if (config.groupBy) {
      grouped = {}
      
      switch (config.groupBy) {
        case 'type':
          grouped.direct = limitedFiltered.filter(c => c.type === 'direct')
          grouped.groups = limitedFiltered.filter(c => c.type === 'group')
          break
        case 'status':
          grouped.unread = limitedFiltered.filter(c => c.hasUnread)
          grouped.read = limitedFiltered.filter(c => !c.hasUnread)
          break
        case 'date':
          const groups = { today: [], yesterday: [], thisWeek: [], older: [] }
          
          limitedFiltered.forEach(conversation => {
            const { lastActivity } = conversation
            if (!lastActivity) {
              groups.older.push(conversation)
              return
            }
            
            if (isFromToday(lastActivity)) {
              groups.today.push(conversation)
            } else if (isFromYesterday(lastActivity)) {
              groups.yesterday.push(conversation)
            } else {
              const daysSince = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
              if (daysSince <= 7) {
                groups.thisWeek.push(conversation)
              } else {
                groups.older.push(conversation)
              }
            }
          })
          
          Object.keys(groups).forEach(key => {
            if (groups[key].length > 0) grouped[key] = groups[key]
          })
          break
        default:
          grouped.all = limitedFiltered
      }
    }

    return { filteredConversations: limitedFiltered, groupedConversations: grouped }
  }, [processedConversations, config, localSearch])

  // Debounced search
  const debouncedSetSearch = useMemo(() => 
    debounce((query) => setLocalSearch(query), 300),
    []
  )

  // Actions
  const actions = useMemo(() => ({
    refresh: async () => {
      setRefreshing(true)
      try {
        await loadConversations(true)
      } finally {
        setRefreshing(false)
      }
    },

    selectConversation: (conversationId) => {
      setActiveConversation(conversationId)
    },
  }), [loadConversations, setActiveConversation])

  // Statistics
  const stats = useMemo(() => {
    const totalUnread = processedConversations.reduce(
      (sum, conv) => sum + conv.unreadCount, 0
    )
    
    return {
      total: processedConversations.length,
      unread: processedConversations.filter(c => c.hasUnread).length,
      direct: processedConversations.filter(c => c.type === 'direct').length,
      groups: processedConversations.filter(c => c.type === 'group').length,
      archived: processedConversations.filter(c => c.isArchived).length,
      online: processedConversations.filter(c => c.isOnline).length,
      totalUnreadMessages: totalUnread,
    }
  }, [processedConversations])

  return {
    // Data
    conversations: filteredConversations,
    groupedConversations,
    processedConversations,
    
    // State
    loading: conversationsLoading,
    refreshing,
    error: conversationsError,
    
    // Search
    searchQuery: localSearch,
    setSearchQuery: debouncedSetSearch,
    
    // Actions
    ...actions,
    
    // Stats & utilities
    stats,
    activeConversationId,
    activeConversation: filteredConversations.find(c => c._id === activeConversationId) || null,
  }
}

// UI state management hook
export const useConversationListUI = () => {
  const [selectedConversations, setSelectedConversations] = useState(new Set())
  const [selectionMode, setSelectionMode] = useState(false)
  const [contextMenu, setContextMenu] = useState({ open: false, conversationId: null, position: { x: 0, y: 0 } })

  const selectionActions = useMemo(() => ({
    toggleSelection: (conversationId) => {
      setSelectedConversations(prev => {
        const newSet = new Set(prev)
        if (newSet.has(conversationId)) {
          newSet.delete(conversationId)
        } else {
          newSet.add(conversationId)
        }
        
        if (newSet.size === 0) setSelectionMode(false)
        return newSet
      })
    },

    selectAll: (conversationIds) => {
      setSelectedConversations(new Set(conversationIds))
      setSelectionMode(true)
    },

    clearSelection: () => {
      setSelectedConversations(new Set())
      setSelectionMode(false)
    },

    enterSelectionMode: (conversationId = null) => {
      setSelectionMode(true)
      if (conversationId) setSelectedConversations(new Set([conversationId]))
    },
  }), [])

  const contextMenuActions = useMemo(() => ({
    showContextMenu: (conversationId, event) => {
      event.preventDefault()
      setContextMenu({
        open: true,
        conversationId,
        position: { x: event.clientX, y: event.clientY }
      })
    },

    hideContextMenu: () => {
      setContextMenu({ open: false, conversationId: null, position: { x: 0, y: 0 } })
    },
  }), [])

  return {
    // Selection state
    selectedConversations: Array.from(selectedConversations),
    selectionMode,
    hasSelection: selectedConversations.size > 0,
    selectionCount: selectedConversations.size,
    isSelected: (conversationId) => selectedConversations.has(conversationId),
    
    // Actions
    ...selectionActions,
    ...contextMenuActions,
    
    // Context menu state
    contextMenu,
  }
}

// Keyboard navigation hook
export const useConversationKeyboard = (conversations) => {
  const { selectConversation, activeConversationId } = useChat()
  const [focusedIndex, setFocusedIndex] = useState(0)

  useEffect(() => {
    if (activeConversationId) {
      const index = conversations.findIndex(c => c._id === activeConversationId)
      if (index !== -1) setFocusedIndex(index)
    }
  }, [activeConversationId, conversations])

  const handleKeyDown = useCallback((event) => {
    if (conversations.length === 0) return

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        setFocusedIndex(prev => prev > 0 ? prev - 1 : conversations.length - 1)
        break
      case 'ArrowDown':
        event.preventDefault()
        setFocusedIndex(prev => prev < conversations.length - 1 ? prev + 1 : 0)
        break
      case 'Enter':
        event.preventDefault()
        if (conversations[focusedIndex]) {
          selectConversation(conversations[focusedIndex]._id)
        }
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
