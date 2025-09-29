import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, X, Users, MessageSquare, Plus, Check, ArrowLeft
} from 'lucide-react'
import { clsx } from 'clsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import { useConversationOperations } from '@/hooks/useChat.jsx'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useOnlineUsers } from '@/hooks/useOnlineUsers.jsx'
import { useToast } from '../ui/Toast.jsx'
import { debounce } from '@/utils/helpers.js'
import userService from '@/services/userService.js'

// Configuration constants
const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 2,
  DEBOUNCE_DELAY: 300,
  MAX_RESULTS: 20,
  MAX_RECENT: 10,
  GROUP_NAME_MIN: 2,
  GROUP_NAME_MAX: 50
}

const MODES = {
  NEW_CHAT: 'newChat',
  NEW_GROUP: 'newGroup', 
  ADD_TO_GROUP: 'addToGroup'
}

const MODE_CONFIG = {
  [MODES.NEW_CHAT]: {
    title: 'New Chat',
    description: 'Search and select a user to start chatting',
    icon: MessageSquare
  },
  [MODES.NEW_GROUP]: {
    title: 'Create Group',
    description: 'Select users and name your group',
    icon: Users
  },
  [MODES.ADD_TO_GROUP]: {
    title: 'Add Participants',
    description: 'Add users to group',
    icon: Plus
  }
}

const UserSearch = ({
  isOpen = false,
  onClose,
  mode = MODES.NEW_CHAT,
  excludeUsers = [],
  existingGroup = null,
  onSuccess,
  className = '',
  ...props
}) => {
  const { user } = useAuth()
  const { createDirectChat, createGroupChat, loading } = useConversationOperations()
  const { getUserOnlineStatus } = useOnlineUsers()
  const toast = useToast()

  // Consolidated state
  const [state, setState] = useState({
    searchQuery: '',
    searchResults: [],
    selectedUsers: [],
    groupName: '',
    isSearching: false,
    recentUsers: [],
    isCreating: false,
    recentUsersLoading: false,
    searchError: null
  })
  
  const searchInputRef = useRef(null)
  const groupNameRef = useRef(null)

  // Memoized configuration
  const config = useMemo(() => MODE_CONFIG[mode], [mode])

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setState(prev => ({
        ...prev,
        selectedUsers: [],
        groupName: '',
        searchQuery: '',
        searchResults: [],
        searchError: null
      }))
      loadRecentUsers()
    }
  }, [isOpen])

  // Focus management
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    if (mode === MODES.NEW_GROUP && state.selectedUsers.length > 0 && groupNameRef.current && !state.groupName) {
      setTimeout(() => groupNameRef.current.focus(), 100)
    }
  }, [state.selectedUsers.length, mode, state.groupName])

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      const trimmedQuery = query.trim()
      
      if (!trimmedQuery || trimmedQuery.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
        setState(prev => ({ ...prev, searchResults: [], isSearching: false, searchError: null }))
        return
      }

      setState(prev => ({ ...prev, isSearching: true, searchError: null }))
      
      try {
        const result = await userService.searchUsers(trimmedQuery, SEARCH_CONFIG.MAX_RESULTS)
        
        if (result.success && Array.isArray(result.data)) {
          const filteredResults = result.data.filter(resultUser => 
            resultUser._id !== user?._id && !excludeUsers.includes(resultUser._id)
          )
          setState(prev => ({ ...prev, searchResults: filteredResults }))
        } else {
          setState(prev => ({ ...prev, searchResults: [], searchError: result.error || 'Search failed' }))
        }
      } catch (error) {
        console.error('User search failed:', error)
        setState(prev => ({ ...prev, searchResults: [], searchError: 'Search temporarily unavailable. Please try again.' }))
      } finally {
        setState(prev => ({ ...prev, isSearching: false }))
      }
    }, SEARCH_CONFIG.DEBOUNCE_DELAY),
    [user, excludeUsers]
  )

  // Load recent users
  const loadRecentUsers = useCallback(async () => {
    if (!user?._id) return

    setState(prev => ({ ...prev, recentUsersLoading: true }))
    
    try {
      if (typeof userService.getRecentContacts === 'function') {
        const result = await userService.getRecentContacts(SEARCH_CONFIG.MAX_RECENT)
        
        if (result.success && Array.isArray(result.data)) {
          const filteredRecent = result.data.filter(recentUser => 
            recentUser._id !== user._id && !excludeUsers.includes(recentUser._id)
          )
          setState(prev => ({ ...prev, recentUsers: filteredRecent }))
        }
      }
    } catch (error) {
      console.error('Failed to load recent users:', error)
    } finally {
      setState(prev => ({ ...prev, recentUsersLoading: false }))
    }
  }, [user, excludeUsers])

  // Memoized handlers
  const handlers = useMemo(() => ({
    handleSearchChange: (value) => {
      setState(prev => ({ ...prev, searchQuery: value }))
      debouncedSearch(value)
    },

    handleUserSelect: (selectedUser) => {
      if (state.isCreating) return

      if (mode === MODES.NEW_CHAT) {
        handlers.handleCreateDirectChat(selectedUser)
      } else {
        setState(prev => {
          const isAlreadySelected = prev.selectedUsers.some(u => u._id === selectedUser._id)
          return {
            ...prev,
            selectedUsers: isAlreadySelected 
              ? prev.selectedUsers.filter(u => u._id !== selectedUser._id)
              : [...prev.selectedUsers, selectedUser]
          }
        })
      }
    },

    handleCreateDirectChat: async (selectedUser) => {
      setState(prev => ({ ...prev, isCreating: true }))
      
      try {
        const result = await createDirectChat(selectedUser._id)
        
        if (result.success) {
          toast.success(`Chat with ${selectedUser.name} started!`)
          onSuccess?.(result.data)
          onClose?.()
        } else {
          toast.error(result.error || 'Failed to create chat')
        }
      } catch (error) {
        console.error('Failed to create direct chat:', error)
        toast.error('Unable to create chat. Please try again.')
      } finally {
        setState(prev => ({ ...prev, isCreating: false }))
      }
    },

    handleCreateGroup: async () => {
      if (state.selectedUsers.length === 0) {
        toast.error('Please select at least one user')
        return
      }

      if (mode === MODES.NEW_GROUP) {
        const trimmedName = state.groupName.trim()
        if (!trimmedName) {
          toast.error('Please enter a group name')
          groupNameRef.current?.focus()
          return
        }

        if (trimmedName.length < SEARCH_CONFIG.GROUP_NAME_MIN || trimmedName.length > SEARCH_CONFIG.GROUP_NAME_MAX) {
          toast.error(`Group name must be between ${SEARCH_CONFIG.GROUP_NAME_MIN}-${SEARCH_CONFIG.GROUP_NAME_MAX} characters`)
          groupNameRef.current?.focus()
          return
        }
      }

      setState(prev => ({ ...prev, isCreating: true }))

      try {
        const groupData = {
          name: state.groupName.trim(),
          participants: state.selectedUsers.map(u => u._id),
          type: 'group'
        }
        
        const result = await createGroupChat(groupData)
        
        if (result.success) {
          toast.success(
            mode === MODES.NEW_GROUP 
              ? `Group "${state.groupName.trim()}" created successfully!`
              : `Added ${state.selectedUsers.length} user${state.selectedUsers.length !== 1 ? 's' : ''} to the group!`
          )
          onSuccess?.(result.data)
          onClose?.()
          
          setState(prev => ({
            ...prev,
            selectedUsers: [],
            groupName: '',
            searchQuery: ''
          }))
        } else {
          toast.error(result.error || 'Failed to create group')
        }
      } catch (error) {
        console.error('Failed to create group:', error)
        toast.error('Unable to create group. Please check your connection and try again.')
      } finally {
        setState(prev => ({ ...prev, isCreating: false }))
      }
    },

    handleRemoveUser: (userId) => {
      if (state.isCreating) return
      setState(prev => ({
        ...prev,
        selectedUsers: prev.selectedUsers.filter(u => u._id !== userId)
      }))
    },

    handleClearSelection: () => {
      if (state.isCreating) return
      setState(prev => ({ ...prev, selectedUsers: [], groupName: '' }))
    },

    handleClose: () => {
      if (state.isCreating) return
      onClose?.()
    }
  }), [mode, state, createDirectChat, createGroupChat, onSuccess, onClose, toast, debouncedSearch])

  // Computed values
  const displayUsers = useMemo(() => {
    return state.searchQuery.trim().length >= SEARCH_CONFIG.MIN_QUERY_LENGTH ? state.searchResults : state.recentUsers
  }, [state.searchQuery, state.searchResults, state.recentUsers])

  const isUserSelected = useCallback((userId) => {
    return state.selectedUsers.some(u => u._id === userId)
  }, [state.selectedUsers])

  const canCreate = useMemo(() => {
    if (mode === MODES.NEW_CHAT) return false
    
    const hasUsers = state.selectedUsers.length > 0
    const hasValidGroupName = mode !== MODES.NEW_GROUP || (
      state.groupName.trim().length >= SEARCH_CONFIG.GROUP_NAME_MIN && 
      state.groupName.trim().length <= SEARCH_CONFIG.GROUP_NAME_MAX
    )
    
    return hasUsers && hasValidGroupName && !state.isCreating && !loading
  }, [state.selectedUsers.length, state.groupName, mode, state.isCreating, loading])

  if (!isOpen) return null

  // Render user item
  const renderUserItem = (searchUser, index) => {
    const isOnline = getUserOnlineStatus?.(searchUser._id) === 'online'
    const isSelected = isUserSelected(searchUser._id)
    
    return (
      <motion.button
        key={searchUser._id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => handlers.handleUserSelect(searchUser)}
        disabled={state.isCreating}
        className={clsx(
          'w-full p-3 rounded-lg text-left transition-all duration-200',
          'hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-cyan-400/50',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isSelected && 'bg-cyan-500/20 border border-cyan-400/50'
        )}
      >
        <div className="flex items-center gap-3">
          {mode !== MODES.NEW_CHAT && (
            <div className={clsx(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
              isSelected ? 'bg-cyan-500 border-cyan-500' : 'border-gray-600'
            )}>
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
          )}

          <div className="flex-shrink-0 relative">
            <img
              src={searchUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(searchUser.name || 'U')}&size=40`}
              alt={searchUser.name}
              className="w-10 h-10 rounded-full"
            />
            
            {isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-dark-surface" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-white truncate">{searchUser.name}</h3>
              {searchUser.isVerified && (
                <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">✓</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className={clsx('text-sm truncate', isOnline ? 'text-green-400' : 'text-gray-400')}>
                {isOnline ? 'Online' : 'Offline'}
              </p>
              {searchUser.username && (
                <p className="text-sm text-gray-500 truncate">@{searchUser.username}</p>
              )}
            </div>
          </div>

          {mode === MODES.NEW_CHAT && <MessageSquare className="w-5 h-5 text-gray-400" />}
        </div>
      </motion.button>
    )
  }

  // Render empty state
  const renderEmptyState = () => {
    if (state.searchError) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-6">
          <div className="text-red-400 mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-red-400 mb-2">Search Error</h3>
          <p className="text-sm text-gray-400 text-center mb-4">{state.searchError}</p>
          <Button variant="secondary" size="sm" onClick={() => debouncedSearch(state.searchQuery)} disabled={state.isSearching}>
            Try Again
          </Button>
        </div>
      )
    }

    if (state.searchQuery.trim().length === 0) {
      if (state.recentUsersLoading) {
        return (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-gray-500" />
            <span className="ml-3 text-gray-400">Loading recent contacts...</span>
          </div>
        )
      }
      return (
        <div className="flex flex-col items-center justify-center py-12 px-6">
          <Search className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">Find Users</h3>
          <p className="text-sm text-gray-400 text-center">Type at least 2 characters to search for users</p>
        </div>
      )
    }

    if (state.searchQuery.trim().length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-6">
          <Search className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">Keep typing...</h3>
          <p className="text-sm text-gray-400 text-center">Search requires at least 2 characters</p>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <Search className="w-12 h-12 text-gray-500 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-500 mb-2">No users found</h3>
        <p className="text-sm text-gray-400 text-center">No users found matching "{state.searchQuery}"</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && handlers.handleClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={clsx(
          'glass rounded-xl w-full max-w-md max-h-[85vh] overflow-hidden border border-gray-600/50',
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlers.handleClose}
                className="w-8 h-8"
                disabled={state.isCreating}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              
              <div>
                <h2 className="text-xl font-semibold text-white">{config.title}</h2>
                <p className="text-sm text-gray-400">
                  {mode === MODES.ADD_TO_GROUP ? `${config.description} ${existingGroup?.name}` : config.description}
                </p>
              </div>
            </div>
          </div>

          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search users... (minimum 2 characters)"
            value={state.searchQuery}
            onChange={(e) => handlers.handleSearchChange(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            rightIcon={state.searchQuery && (
              <button
                onClick={() => handlers.handleSearchChange('')}
                className="hover:text-white transition-colors"
                disabled={state.isCreating}
              >
                <X className="w-4 h-4" />
              </button>
            )}
            disabled={state.isCreating}
          />
        </div>

        {/* Group Name Input */}
        {mode === MODES.NEW_GROUP && (
          <div className="px-6 py-3 border-b border-gray-700/50">
            <Input
              ref={groupNameRef}
              type="text"
              placeholder={`Enter group name (${SEARCH_CONFIG.GROUP_NAME_MIN}-${SEARCH_CONFIG.GROUP_NAME_MAX} characters)`}
              value={state.groupName}
              onChange={(e) => setState(prev => ({ ...prev, groupName: e.target.value }))}
              leftIcon={<Users className="w-4 h-4" />}
              disabled={state.isCreating}
              maxLength={SEARCH_CONFIG.GROUP_NAME_MAX}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                {state.selectedUsers.length === 0 
                  ? 'Select users below, then name your group'
                  : 'Give your group a memorable name'
                }
              </p>
              <span className="text-xs text-gray-500">{state.groupName.length}/{SEARCH_CONFIG.GROUP_NAME_MAX}</span>
            </div>
          </div>
        )}

        {/* Selected Users */}
        {mode !== MODES.NEW_CHAT && state.selectedUsers.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">Selected ({state.selectedUsers.length})</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlers.handleClearSelection}
                className="text-xs"
                disabled={state.isCreating}
              >
                Clear All
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              <AnimatePresence>
                {state.selectedUsers.map((selectedUser) => (
                  <motion.div
                    key={selectedUser._id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="flex items-center gap-2 bg-cyan-500/20 rounded-full pl-1 pr-3 py-1"
                  >
                    <img
                      src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name || 'U')}&size=24`}
                      alt={selectedUser.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm text-cyan-400 font-medium truncate max-w-20">
                      {selectedUser.name}
                    </span>
                    <button
                      onClick={() => handlers.handleRemoveUser(selectedUser._id)}
                      className="text-cyan-400 hover:text-cyan-300 transition-colors"
                      disabled={state.isCreating}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* User List */}
        <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[400px]">
          {state.isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-cyan-400" />
              <span className="ml-3 text-gray-400">Searching users...</span>
            </div>
          ) : displayUsers.length > 0 ? (
            <div className="p-2">
              {displayUsers.map(renderUserItem)}
            </div>
          ) : (
            renderEmptyState()
          )}
        </div>

        {/* Actions */}
        {mode !== MODES.NEW_CHAT && (
          <div className="p-6 pt-4 border-t border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                <span>{state.selectedUsers.length} user{state.selectedUsers.length !== 1 ? 's' : ''} selected</span>
                {mode === MODES.NEW_GROUP && state.groupName.trim() && (
                  <span className="block text-xs mt-1 truncate max-w-40">"{state.groupName.trim()}"</span>
                )}
              </div>
              
              <Button
                variant="primary"
                onClick={handlers.handleCreateGroup}
                disabled={!canCreate}
                loading={state.isCreating || loading}
                leftIcon={mode === MODES.NEW_GROUP ? <Users className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              >
                {state.isCreating ? 'Creating...' : 
                 mode === MODES.NEW_GROUP ? 'Create Group' : 'Add Users'}
              </Button>
            </div>
            
            {!canCreate && state.selectedUsers.length > 0 && mode === MODES.NEW_GROUP && !state.groupName.trim() && (
              <p className="text-xs text-yellow-400 mt-2">Enter a group name to continue</p>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default UserSearch
