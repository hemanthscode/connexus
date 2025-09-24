import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  X, 
  Users, 
  MessageSquare, 
  Plus,
  Check,
  ArrowLeft
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

const UserSearch = ({
  isOpen = false,
  onClose,
  mode = 'newChat', // 'newChat', 'newGroup', 'addToGroup'
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

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [groupName, setGroupName] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [recentUsers, setRecentUsers] = useState([])
  
  const searchInputRef = useRef(null)

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Load recent users on mount
  useEffect(() => {
    if (isOpen) {
      loadRecentUsers()
    }
  }, [isOpen])

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      const trimmedQuery = query.trim()
      
      // FIXED: Clear results if query is empty
      if (!trimmedQuery) {
        setSearchResults([])
        setIsSearching(false)
        return
      }

      // FIXED: Check minimum length before making API call
      if (trimmedQuery.length < 2) {
        setSearchResults([])
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      
      try {
        const result = await userService.searchUsers(trimmedQuery, 20)
        
        if (result.success) {
          // Filter out current user and excluded users
          const filteredResults = result.data.filter(resultUser => 
            resultUser._id !== user?._id && 
            !excludeUsers.includes(resultUser._id)
          )
          
          setSearchResults(filteredResults)
        } else {
          setSearchResults([])
          toast.error(result.error || 'Search failed')
        }
      } catch (error) {
        console.error('User search failed:', error)
        setSearchResults([])
        toast.error('Search failed')
      } finally {
        setIsSearching(false)
      }
    }, 500),
    [user, excludeUsers, toast]
  )

  // Handle search input change
  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value)
    debouncedSearch(value)
  }, [debouncedSearch])

  // Load recent users
  const loadRecentUsers = useCallback(async () => {
    try {
      // FIXED: Add some mock recent users for now
      const mockRecentUsers = [
        {
          _id: 'recent-1',
          name: 'John Doe',
          email: 'john@example.com',
          avatar: null,
          status: 'online'
        },
        {
          _id: 'recent-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          avatar: null,
          status: 'offline'
        }
      ]
      
      // Filter out current user and excluded users
      const filteredRecent = mockRecentUsers.filter(recentUser => 
        recentUser._id !== user?._id && 
        !excludeUsers.includes(recentUser._id)
      )
      
      setRecentUsers(filteredRecent)
    } catch (error) {
      console.error('Failed to load recent users:', error)
    }
  }, [user, excludeUsers])

  // Handle user selection
  const handleUserSelect = useCallback((selectedUser) => {
    if (mode === 'newChat') {
      // Direct chat - immediately create conversation
      handleCreateDirectChat(selectedUser)
    } else {
      // Group chat - add to selection
      setSelectedUsers(prev => {
        const isAlreadySelected = prev.some(u => u._id === selectedUser._id)
        
        if (isAlreadySelected) {
          return prev.filter(u => u._id !== selectedUser._id)
        } else {
          return [...prev, selectedUser]
        }
      })
    }
  }, [mode])

  // Create direct chat
  const handleCreateDirectChat = useCallback(async (selectedUser) => {
    try {
      const result = await createDirectChat(selectedUser._id)
      
      if (result.success) {
        onSuccess?.(result.data)
        onClose?.()
      }
    } catch (error) {
      console.error('Failed to create direct chat:', error)
    }
  }, [createDirectChat, onSuccess, onClose])

  // Create group chat
  const handleCreateGroup = useCallback(async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user')
      return
    }

    if (!groupName.trim()) {
      toast.error('Please enter a group name')
      return
    }

    try {
      const result = await createGroupChat({
        name: groupName.trim(),
        participants: selectedUsers.map(u => u._id)
      })
      
      if (result.success) {
        onSuccess?.(result.data)
        onClose?.()
      }
    } catch (error) {
      console.error('Failed to create group:', error)
    }
  }, [selectedUsers, groupName, createGroupChat, onSuccess, onClose, toast])

  // Remove selected user
  const handleRemoveUser = useCallback((userId) => {
    setSelectedUsers(prev => prev.filter(u => u._id !== userId))
  }, [])

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedUsers([])
    setGroupName('')
  }, [])

  // Get display users (search results or recent)
  const displayUsers = searchQuery.trim().length >= 2 ? searchResults : recentUsers // FIXED: Only show search results if query is long enough

  const isUserSelected = useCallback((userId) => {
    return selectedUsers.some(u => u._id === userId)
  }, [selectedUsers])

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={clsx(
          'glass rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden',
          'border border-gray-600/50',
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="w-8 h-8"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {mode === 'newChat' && 'New Chat'}
                  {mode === 'newGroup' && 'New Group'}
                  {mode === 'addToGroup' && 'Add Participants'}
                </h2>
                <p className="text-sm text-gray-400">
                  {mode === 'newChat' && 'Search for users to start a chat'}
                  {mode === 'newGroup' && `Select users to create a group`}
                  {mode === 'addToGroup' && `Add users to ${existingGroup?.name}`}
                </p>
              </div>
            </div>
          </div>

          {/* Search Input */}
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search users... (min 2 characters)" // FIXED: Updated placeholder
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            rightIcon={searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          />
        </div>

        {/* Selected Users (Group mode) */}
        {mode !== 'newChat' && selectedUsers.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">
                Selected ({selectedUsers.length})
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                className="text-xs"
              >
                Clear All
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((selectedUser) => (
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
                  <span className="text-sm text-cyan-400 font-medium">
                    {selectedUser.name}
                  </span>
                  <button
                    onClick={() => handleRemoveUser(selectedUser._id)}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Group Name Input */}
        {mode === 'newGroup' && selectedUsers.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-700/50">
            <Input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              leftIcon={<Users className="w-4 h-4" />}
            />
          </div>
        )}

        {/* User List */}
        <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[400px]">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-cyan-400" />
            </div>
          ) : displayUsers.length > 0 ? (
            <div className="p-2">
              {displayUsers.map((searchUser, index) => {
                const isOnline = getUserOnlineStatus(searchUser._id) === 'online'
                const isSelected = isUserSelected(searchUser._id)
                
                return (
                  <motion.button
                    key={searchUser._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleUserSelect(searchUser)}
                    className={clsx(
                      'w-full p-3 rounded-lg text-left transition-all duration-200',
                      'hover:bg-white/5 active:scale-[0.98]',
                      isSelected && 'bg-cyan-500/20 border border-cyan-400/50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Selection indicator */}
                      {mode !== 'newChat' && (
                        <div className={clsx(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                          isSelected 
                            ? 'bg-cyan-500 border-cyan-500' 
                            : 'border-gray-600'
                        )}>
                          {isSelected && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      )}

                      {/* Avatar */}
                      <div className="flex-shrink-0 relative">
                        <img
                          src={searchUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(searchUser.name || 'U')}&size=40`}
                          alt={searchUser.name}
                          className="w-10 h-10 rounded-full"
                        />
                        
                        {/* Online indicator */}
                        {isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-dark-surface" />
                        )}
                      </div>

                      {/* User info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white truncate">
                            {searchUser.name}
                          </h3>
                          {searchUser.isBot && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                              BOT
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className={clsx(
                            'text-sm truncate',
                            isOnline ? 'text-green-400' : 'text-gray-400'
                          )}>
                            {isOnline ? 'Online' : 'Offline'}
                          </p>
                          {searchUser.email && (
                            <p className="text-sm text-gray-500 truncate">
                              {searchUser.email}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action icon */}
                      {mode === 'newChat' && (
                        <MessageSquare className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <Search className="w-12 h-12 text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">
                {/* FIXED: Better messaging */}
                {searchQuery.trim().length === 0 ? 'Recent Contacts' : 
                 searchQuery.trim().length < 2 ? 'Type at least 2 characters' :
                 'No users found'}
              </h3>
              <p className="text-sm text-gray-500 text-center">
                {searchQuery.trim().length === 0 ? 'Start typing to search for users' :
                 searchQuery.trim().length < 2 ? 'Search requires at least 2 characters' :
                 `No users found matching "${searchQuery}"`}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {mode !== 'newChat' && (
          <div className="p-6 pt-4 border-t border-gray-700/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">
                {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
              </span>
              
              <Button
                variant="primary"
                onClick={handleCreateGroup}
                disabled={selectedUsers.length === 0 || (mode === 'newGroup' && !groupName.trim())}
                loading={loading}
                leftIcon={mode === 'newGroup' ? <Users className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              >
                {mode === 'newGroup' && 'Create Group'}
                {mode === 'addToGroup' && 'Add to Group'}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default UserSearch
