import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSocket } from './useSocket.jsx'
import { useAuth } from './useAuth.jsx'
import { formatLastSeen } from '@/utils/formatters.js'
import { DEBUG } from '@/utils/constants.js'

/**
 * Hook for tracking and managing online users
 */
export const useOnlineUsers = (options = {}) => {
  const {
    includeCurrentUser = false,
    sortBy = 'status', // 'status', 'name', 'lastSeen'
    filterBy = null, // function to filter users
    groupBy = null, // 'status' to group by online/offline
  } = options

  const { onlineUsers, getUserOnlineStatus, isConnected } = useSocket()
  const { user: currentUser } = useAuth()
  
  const [userDetails, setUserDetails] = useState(new Map())
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  // Process and filter online users
  const processedUsers = useMemo(() => {
    let users = [...onlineUsers]

    // Filter out current user if not included
    if (!includeCurrentUser && currentUser) {
      users = users.filter(user => user.userId !== currentUser._id)
    }

    // Apply custom filter
    if (filterBy && typeof filterBy === 'function') {
      users = users.filter(filterBy)
    }

    // Enhance with additional details
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
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '')
        case 'lastSeen':
          if (!a.lastSeen && !b.lastSeen) return 0
          if (!a.lastSeen) return 1
          if (!b.lastSeen) return -1
          return new Date(b.lastSeen) - new Date(a.lastSeen)
        case 'status':
        default:
          // Online first, then away, then offline
          const statusOrder = { online: 0, away: 1, offline: 2 }
          const aOrder = statusOrder[a.status] || 3
          const bOrder = statusOrder[b.status] || 3
          
          if (aOrder !== bOrder) return aOrder - bOrder
          
          // Secondary sort by name
          return (a.name || '').localeCompare(b.name || '')
      }
    })

    return users
  }, [onlineUsers, currentUser, includeCurrentUser, filterBy, sortBy, userDetails])

  // Group users by status if requested
  const groupedUsers = useMemo(() => {
    if (groupBy !== 'status') return null

    return processedUsers.reduce((groups, user) => {
      const status = user.status
      if (!groups[status]) {
        groups[status] = []
      }
      groups[status].push(user)
      return groups
    }, {})
  }, [processedUsers, groupBy])

  // Update user details (from API or cache)
  const updateUserDetails = useCallback((userId, details) => {
    setUserDetails(prev => {
      const updated = new Map(prev)
      updated.set(userId, { ...updated.get(userId), ...details })
      return updated
    })
    setLastUpdate(Date.now())
  }, [])

  // Get user details by ID
  const getUserDetails = useCallback((userId) => {
    return userDetails.get(userId) || null
  }, [userDetails])

  // Check if user is online
  const isUserOnline = useCallback((userId) => {
    return getUserOnlineStatus(userId) === 'online'
  }, [getUserOnlineStatus])

  // Get online users count by status
  const getStatusCounts = useCallback(() => {
    return processedUsers.reduce((counts, user) => {
      counts[user.status] = (counts[user.status] || 0) + 1
      counts.total = (counts.total || 0) + 1
      return counts
    }, {})
  }, [processedUsers])

  // Get users by conversation
  const getUsersByConversation = useCallback((conversationId, participants = []) => {
    const conversationUsers = participants
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
        // Online users first
        if (a.isOnline && !b.isOnline) return -1
        if (!a.isOnline && b.isOnline) return 1
        return 0
      })

    return conversationUsers
  }, [processedUsers])

  // Search users
  const searchUsers = useCallback((query) => {
    if (!query || query.length < 2) return processedUsers

    const lowercaseQuery = query.toLowerCase()
    return processedUsers.filter(user => 
      (user.name || '').toLowerCase().includes(lowercaseQuery) ||
      (user.email || '').toLowerCase().includes(lowercaseQuery)
    )
  }, [processedUsers])

  // Auto-refresh user data periodically
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      setLastUpdate(Date.now())
    }, 30000) // Update every 30 seconds

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
    statusCounts: getStatusCounts(),
    
    // Utility functions
    updateUserDetails,
    getUserDetails,
    isUserOnline,
    getUsersByConversation,
    searchUsers,
    getUserOnlineStatus, // FIXED: Added missing function
    
    // State
    isConnected,
    lastUpdate,
  }
}

// ... (rest of the hooks remain the same)

/**
 * Hook for tracking specific user's online status
 */
export const useUserOnlineStatus = (userId) => {
  const { getUserOnlineStatus, onlineUsers } = useSocket()
  const [status, setStatus] = useState('offline')
  const [lastSeen, setLastSeen] = useState(null)

  useEffect(() => {
    if (!userId) return

    const userStatus = getUserOnlineStatus(userId)
    const userInfo = onlineUsers.find(u => u.userId === userId)
    
    setStatus(userStatus)
    setLastSeen(userInfo?.lastSeen || null)
  }, [userId, getUserOnlineStatus, onlineUsers])

  return {
    status,
    lastSeen,
    isOnline: status === 'online',
    isAway: status === 'away',
    isOffline: status === 'offline',
    lastSeenFormatted: lastSeen ? formatLastSeen(lastSeen) : null,
    statusIcon: getStatusIcon(status),
    statusColor: getStatusColor(status),
  }
}

/**
 * Hook for managing user presence in conversations
 */
export const useConversationPresence = (conversationId, participants = []) => {
  const { users, getUsersByConversation } = useOnlineUsers()
  const [conversationUsers, setConversationUsers] = useState([])

  useEffect(() => {
    if (!conversationId || !participants.length) {
      setConversationUsers([])
      return
    }

    const updatedUsers = getUsersByConversation(conversationId, participants)
    setConversationUsers(updatedUsers)
  }, [conversationId, participants, users, getUsersByConversation])

  const onlineParticipants = conversationUsers.filter(u => u.isOnline)
  const awayParticipants = conversationUsers.filter(u => u.status === 'away')
  const offlineParticipants = conversationUsers.filter(u => u.status === 'offline')

  return {
    participants: conversationUsers,
    onlineParticipants,
    awayParticipants,
    offlineParticipants,
    onlineCount: onlineParticipants.length,
    totalCount: conversationUsers.length,
    hasOnlineUsers: onlineParticipants.length > 0,
  }
}

/**
 * Hook for bulk user operations
 */
export const useBulkUserOperations = () => {
  const { users, updateUserDetails } = useOnlineUsers()

  const bulkUpdateUsers = useCallback(async (userUpdates) => {
    const promises = userUpdates.map(({ userId, details }) => 
      updateUserDetails(userId, details)
    )
    
    await Promise.all(promises)
  }, [updateUserDetails])

  const getUsersById = useCallback((userIds) => {
    return users.filter(user => userIds.includes(user.userId))
  }, [users])

  const getUsersByStatus = useCallback((status) => {
    return users.filter(user => user.status === status)
  }, [users])

  return {
    bulkUpdateUsers,
    getUsersById,
    getUsersByStatus,
    allUsers: users
  }
}

// Helper functions
const getStatusIcon = (status) => {
  switch (status) {
    case 'online':
      return '🟢'
    case 'away':
      return '🟡'
    case 'offline':
      return '⚫'
    default:
      return '❓'
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case 'online':
      return 'text-green-400'
    case 'away':
      return 'text-yellow-400'
    case 'offline':
      return 'text-gray-400'
    default:
      return 'text-gray-500'
  }
}

export default useOnlineUsers
