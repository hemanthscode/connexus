import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSocket } from './useSocket.jsx'
import { useAuth } from './useAuth.jsx'
import { formatLastSeen } from '@/utils/formatters.js'
import { DEBUG } from '@/utils/constants.js'

// Configuration constants
const STATUS_CONFIG = {
  ORDER: { online: 0, away: 1, offline: 2 },
  ICONS: { online: '🟢', away: '🟡', offline: '⚫', default: '❓' },
  COLORS: { 
    online: 'text-green-400', 
    away: 'text-yellow-400', 
    offline: 'text-gray-400', 
    default: 'text-gray-500' 
  },
  UPDATE_INTERVAL: 30000
}

const DEFAULT_OPTIONS = {
  includeCurrentUser: false,
  sortBy: 'status', // 'status', 'name', 'lastSeen'
  filterBy: null,
  groupBy: null, // 'status' to group by online/offline
}

// Helper functions
const getStatusIcon = (status) => STATUS_CONFIG.ICONS[status] || STATUS_CONFIG.ICONS.default
const getStatusColor = (status) => STATUS_CONFIG.COLORS[status] || STATUS_CONFIG.COLORS.default

export const useOnlineUsers = (options = {}) => {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const { onlineUsers, getUserOnlineStatus, isConnected } = useSocket()
  const { user: currentUser } = useAuth()
  
  const [userDetails, setUserDetails] = useState(new Map())
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  // Process and enhance users with memoization
  const processedUsers = useMemo(() => {
    let users = [...onlineUsers]

    // Filter current user if needed
    if (!config.includeCurrentUser && currentUser) {
      users = users.filter(user => user.userId !== currentUser._id)
    }

    // Apply custom filter
    if (config.filterBy && typeof config.filterBy === 'function') {
      users = users.filter(config.filterBy)
    }

    // Enhance with details and metadata
    users = users.map(user => {
      const details = userDetails.get(user.userId)
      return {
        ...user,
        ...details,
        isOnline: user.status === 'online',
        isAway: user.status === 'away',
        isOffline: user.status === 'offline',
        lastSeenFormatted: user.lastSeen ? formatLastSeen(user.lastSeen) : null,
        statusIcon: getStatusIcon(user.status),
        statusColor: getStatusColor(user.status),
      }
    })

    // Sort users
    users.sort((a, b) => {
      switch (config.sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '')
        case 'lastSeen':
          if (!a.lastSeen && !b.lastSeen) return 0
          if (!a.lastSeen) return 1
          if (!b.lastSeen) return -1
          return new Date(b.lastSeen) - new Date(a.lastSeen)
        case 'status':
        default:
          const aOrder = STATUS_CONFIG.ORDER[a.status] || 3
          const bOrder = STATUS_CONFIG.ORDER[b.status] || 3
          
          return aOrder !== bOrder 
            ? aOrder - bOrder 
            : (a.name || '').localeCompare(b.name || '')
      }
    })

    return users
  }, [onlineUsers, currentUser, config, userDetails])

  // Group users by status if requested
  const groupedUsers = useMemo(() => {
    if (config.groupBy !== 'status') return null

    return processedUsers.reduce((groups, user) => {
      const status = user.status
      if (!groups[status]) groups[status] = []
      groups[status].push(user)
      return groups
    }, {})
  }, [processedUsers, config.groupBy])

  // Memoized utility functions
  const utilities = useMemo(() => ({
    updateUserDetails: (userId, details) => {
      setUserDetails(prev => {
        const updated = new Map(prev)
        updated.set(userId, { ...updated.get(userId), ...details })
        return updated
      })
      setLastUpdate(Date.now())
    },

    getUserDetails: (userId) => userDetails.get(userId) || null,

    isUserOnline: (userId) => getUserOnlineStatus(userId) === 'online',

    searchUsers: (query) => {
      if (!query || query.length < 2) return processedUsers
      
      const lowercaseQuery = query.toLowerCase()
      return processedUsers.filter(user => 
        (user.name || '').toLowerCase().includes(lowercaseQuery) ||
        (user.email || '').toLowerCase().includes(lowercaseQuery)
      )
    },

    getUsersByConversation: (conversationId, participants = []) => {
      return participants
        .map(participant => {
          const userId = typeof participant === 'string' ? participant : participant.user?._id || participant.userId
          const onlineUser = processedUsers.find(u => u.userId === userId)
          
          return {
            ...participant,
            userId,
            status: onlineUser?.status || 'offline',
            isOnline: onlineUser?.status === 'online',
            lastSeen: onlineUser?.lastSeen,
            lastSeenFormatted: onlineUser?.lastSeenFormatted
          }
        })
        .sort((a, b) => {
          if (a.isOnline && !b.isOnline) return -1
          if (!a.isOnline && b.isOnline) return 1
          return 0
        })
    },
  }), [userDetails, getUserOnlineStatus, processedUsers])

  // Status counts with memoization
  const statusCounts = useMemo(() => {
    return processedUsers.reduce((counts, user) => {
      counts[user.status] = (counts[user.status] || 0) + 1
      counts.total = (counts.total || 0) + 1
      return counts
    }, {})
  }, [processedUsers])

  // Auto-refresh user data
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      setLastUpdate(Date.now())
    }, STATUS_CONFIG.UPDATE_INTERVAL)

    return () => clearInterval(interval)
  }, [isConnected])

  // Debug logging
  useEffect(() => {
    if (DEBUG.SOCKET_LOGS) {
      console.log('Online users updated:', {
        total: processedUsers.length,
        online: processedUsers.filter(u => u.status === 'online').length,
        away: processedUsers.filter(u => u.status === 'away').length,
        offline: processedUsers.filter(u => u.status === 'offline').length
      })
    }
  }, [processedUsers])

  return {
    // Users data
    users: processedUsers,
    groupedUsers,
    totalCount: processedUsers.length,
    
    // Status counts
    onlineCount: processedUsers.filter(u => u.status === 'online').length,
    awayCount: processedUsers.filter(u => u.status === 'away').length,
    offlineCount: processedUsers.filter(u => u.status === 'offline').length,
    statusCounts,
    
    // Utilities
    ...utilities,
    getUserOnlineStatus,
    
    // State
    isConnected,
    lastUpdate,
  }
}

// Specific user status hook
export const useUserOnlineStatus = (userId) => {
  const { getUserOnlineStatus, onlineUsers } = useSocket()
  
  const userStatus = useMemo(() => {
    if (!userId) return { status: 'offline', lastSeen: null }
    
    const status = getUserOnlineStatus(userId)
    const userInfo = onlineUsers.find(u => u.userId === userId)
    
    return {
      status,
      lastSeen: userInfo?.lastSeen || null,
      isOnline: status === 'online',
      isAway: status === 'away',
      isOffline: status === 'offline',
      lastSeenFormatted: userInfo?.lastSeen ? formatLastSeen(userInfo.lastSeen) : null,
      statusIcon: getStatusIcon(status),
      statusColor: getStatusColor(status),
    }
  }, [userId, getUserOnlineStatus, onlineUsers])

  return userStatus
}

// Conversation presence hook
export const useConversationPresence = (conversationId, participants = []) => {
  const { users, getUsersByConversation } = useOnlineUsers()
  
  const conversationUsers = useMemo(() => {
    if (!conversationId || !participants.length) return []
    return getUsersByConversation(conversationId, participants)
  }, [conversationId, participants, users, getUsersByConversation])

  const presenceData = useMemo(() => {
    const online = conversationUsers.filter(u => u.isOnline)
    const away = conversationUsers.filter(u => u.status === 'away')
    const offline = conversationUsers.filter(u => u.status === 'offline')

    return {
      participants: conversationUsers,
      onlineParticipants: online,
      awayParticipants: away,
      offlineParticipants: offline,
      onlineCount: online.length,
      totalCount: conversationUsers.length,
      hasOnlineUsers: online.length > 0,
    }
  }, [conversationUsers])

  return presenceData
}

// Bulk operations hook
export const useBulkUserOperations = () => {
  const { users, updateUserDetails } = useOnlineUsers()

  const operations = useMemo(() => ({
    bulkUpdateUsers: async (userUpdates) => {
      const promises = userUpdates.map(({ userId, details }) => 
        updateUserDetails(userId, details)
      )
      await Promise.all(promises)
    },

    getUsersById: (userIds) => users.filter(user => userIds.includes(user.userId)),
    getUsersByStatus: (status) => users.filter(user => user.status === status),
  }), [users, updateUserDetails])

  return {
    ...operations,
    allUsers: users
  }
}

export default useOnlineUsers
