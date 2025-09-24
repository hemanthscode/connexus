import { useMemo, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Archive, 
  Pin, 
  Trash2, 
  Volume2, 
  VolumeX,
  Star,
  MessageSquare,
  Users,
  Filter
} from 'lucide-react'
import { clsx } from 'clsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import Dropdown, { DropdownItem, DropdownSeparator } from '../ui/Dropdown.jsx'
import { useConversations, useConversationListUI } from '@/hooks/useConversations.jsx'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useOnlineUsers } from '@/hooks/useOnlineUsers.jsx'
import { formatConversationTime } from '@/utils/formatters.js'
import { truncateText } from '@/utils/helpers.js'

const ConversationList = ({
  onConversationSelect,
  onNewChat,
  onNewGroup,
  activeConversationId,
  className = '',
  ...props
}) => {
  const { user } = useAuth()
  const { getUserOnlineStatus } = useOnlineUsers()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBy, setFilterBy] = useState('all')
  const [sortBy, setSortBy] = useState('lastMessage')

  const {
    conversations,
    loading,
    refreshing,
    refresh,
    stats
  } = useConversations({
    sortBy,
    filterBy,
    searchQuery,
    limit: 100
  })

  const {
    selectedConversations,
    selectionMode,
    toggleSelection,
    clearSelection,
    contextMenu,
    showContextMenu,
    hideContextMenu
  } = useConversationListUI()

  const searchInputRef = useRef(null)

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All', count: stats.total },
    { value: 'unread', label: 'Unread', count: stats.unread },
    { value: 'direct', label: 'Direct', count: stats.direct },
    { value: 'groups', label: 'Groups', count: stats.groups },
    { value: 'archived', label: 'Archived', count: stats.archived },
    { value: 'online', label: 'Online', count: stats.online },
  ]

  const activeFilter = filterOptions.find(f => f.value === filterBy)

  // Handle conversation actions
  const handleConversationClick = useCallback((conversation) => {
    if (selectionMode) {
      toggleSelection(conversation._id)
    } else {
      onConversationSelect?.(conversation._id)
    }
  }, [selectionMode, toggleSelection, onConversationSelect])

  const handleArchive = useCallback((conversationId) => {
    // Implementation would call archive API
    console.log('Archive conversation:', conversationId)
    hideContextMenu()
  }, [hideContextMenu])

  const handlePin = useCallback((conversationId) => {
    // Implementation would call pin API
    console.log('Pin conversation:', conversationId)
    hideContextMenu()
  }, [hideContextMenu])

  const handleMute = useCallback((conversationId) => {
    // Implementation would call mute API
    console.log('Mute conversation:', conversationId)
    hideContextMenu()
  }, [hideContextMenu])

  const handleDelete = useCallback((conversationId) => {
    // Implementation would call delete API with confirmation
    console.log('Delete conversation:', conversationId)
    hideContextMenu()
  }, [hideContextMenu])

  // Get conversation display info
  const getConversationInfo = useCallback((conversation) => {
    if (conversation.type === 'group') {
      return {
        name: conversation.name || 'Unnamed Group',
        avatar: conversation.avatar,
        subtitle: `${conversation.participants?.length || 0} participants`,
        isOnline: false
      }
    }
    
    // Direct conversation
    const otherParticipant = conversation.participants?.find(
      p => p.user._id !== user?._id
    )
    
    const isOnline = otherParticipant 
      ? getUserOnlineStatus(otherParticipant.user._id) === 'online'
      : false
    
    return {
      name: otherParticipant?.user?.name || 'Unknown User',
      avatar: otherParticipant?.user?.avatar,
      subtitle: isOnline ? 'Online' : 'Offline',
      isOnline
    }
  }, [user, getUserOnlineStatus])

  // Context menu items
  const getContextMenuItems = useCallback((conversation) => [
    {
      label: conversation.isPinned ? 'Unpin' : 'Pin',
      icon: <Pin className="w-4 h-4" />,
      onClick: () => handlePin(conversation._id)
    },
    {
      label: 'Star',
      icon: <Star className="w-4 h-4" />,
      onClick: () => {/* Handle star */}
    },
    {
      label: conversation.isMuted ? 'Unmute' : 'Mute',
      icon: conversation.isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />,
      onClick: () => handleMute(conversation._id)
    },
    { type: 'separator' },
    {
      label: 'Archive',
      icon: <Archive className="w-4 h-4" />,
      onClick: () => handleArchive(conversation._id)
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => handleDelete(conversation._id),
      variant: 'danger'
    }
  ], [handlePin, handleMute, handleArchive, handleDelete])

  return (
    <div className={clsx('flex flex-col h-full', className)} {...props}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Messages</h2>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={refresh}
              loading={refreshing}
              className="w-8 h-8"
            >
              <Search className="w-4 h-4" />
            </Button>
            
            <Dropdown
              trigger={
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <Plus className="w-4 h-4" />
                </Button>
              }
            >
              <DropdownItem
                onClick={onNewChat}
                leftIcon={<MessageSquare className="w-4 h-4" />}
              >
                New Chat
              </DropdownItem>
              <DropdownItem
                onClick={onNewGroup}
                leftIcon={<Users className="w-4 h-4" />}
              >
                New Group
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        {/* Search */}
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
          className="mb-4"
        />

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Dropdown
            trigger={
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<Filter className="w-3 h-3" />}
                className="text-xs"
              >
                {activeFilter?.label} ({activeFilter?.count})
              </Button>
            }
          >
            {filterOptions.map((option) => (
              <DropdownItem
                key={option.value}
                onClick={() => setFilterBy(option.value)}
                selected={filterBy === option.value}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{option.label}</span>
                  <span className="text-xs text-gray-400">
                    {option.count}
                  </span>
                </div>
              </DropdownItem>
            ))}
          </Dropdown>
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {loading && conversations.length === 0 ? (
          // Loading skeleton
          <div className="space-y-2 p-2">
            {Array.from({ length: 8 }, (_, i) => (
              <ConversationSkeleton key={i} />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          // Empty state
          <EmptyConversationList
            searchQuery={searchQuery}
            filterBy={filterBy}
            onNewChat={onNewChat}
          />
        ) : (
          <div className="space-y-1 p-2">
            <AnimatePresence>
              {conversations.map((conversation, index) => {
                const info = getConversationInfo(conversation)
                const isActive = conversation._id === activeConversationId
                const isSelected = selectedConversations.includes(conversation._id)

                return (
                  <ConversationItem
                    key={conversation._id}
                    conversation={conversation}
                    info={info}
                    isActive={isActive}
                    isSelected={isSelected}
                    selectionMode={selectionMode}
                    onClick={() => handleConversationClick(conversation)}
                    onContextMenu={(e) => showContextMenu(conversation._id, e)}
                    index={index}
                  />
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu.open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50"
            style={{
              top: contextMenu.position.y,
              left: contextMenu.position.x
            }}
          >
            <div className="glass rounded-lg shadow-2xl border border-gray-600/50 py-2 min-w-[160px]">
              {getContextMenuItems(
                conversations.find(c => c._id === contextMenu.conversationId)
              ).map((item, index) => (
                item.type === 'separator' ? (
                  <DropdownSeparator key={index} />
                ) : (
                  <DropdownItem
                    key={index}
                    onClick={item.onClick}
                    variant={item.variant}
                    leftIcon={item.icon}
                  >
                    {item.label}
                  </DropdownItem>
                )
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Individual conversation item
const ConversationItem = ({
  conversation,
  info,
  isActive,
  isSelected,
  selectionMode,
  onClick,
  onContextMenu,
  index
}) => {
  const lastMessage = conversation.lastMessage
  const unreadCount = conversation.unreadCount || 0
  const hasUnread = unreadCount > 0

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={clsx(
        'w-full p-3 rounded-lg text-left transition-all duration-200',
        'hover:bg-white/5 active:scale-[0.98]',
        isActive && 'bg-cyan-500/20 border border-cyan-400/50',
        isSelected && 'bg-blue-500/20 border border-blue-400/50',
        hasUnread && !isActive && 'bg-white/5'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Selection checkbox */}
        {selectionMode && (
          <div className="flex-shrink-0">
            <input
              type="checkbox"
              checked={isSelected}
              readOnly
              className="w-4 h-4 rounded border-gray-600 text-cyan-400"
            />
          </div>
        )}

        {/* Avatar */}
        <div className="flex-shrink-0 relative">
          {info.avatar ? (
            <img
              src={info.avatar}
              alt={info.name}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {info.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Online indicator */}
          {info.isOnline && conversation.type === 'direct' && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-dark-surface" />
          )}

          {/* Unread badge */}
          {hasUnread && (
            <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <h3 className={clsx(
                'font-semibold truncate',
                hasUnread ? 'text-white' : 'text-gray-300'
              )}>
                {info.name}
              </h3>
              
              {/* Status indicators */}
              <div className="flex items-center gap-1">
                {conversation.isPinned && (
                  <Pin className="w-3 h-3 text-yellow-400" />
                )}
                {conversation.isMuted && (
                  <VolumeX className="w-3 h-3 text-gray-400" />
                )}
                {conversation.isStarred && (
                  <Star className="w-3 h-3 text-yellow-400" />
                )}
              </div>
            </div>

            <span className={clsx(
              'text-xs flex-shrink-0',
              hasUnread ? 'text-cyan-400 font-medium' : 'text-gray-500'
            )}>
              {lastMessage?.timestamp && formatConversationTime(lastMessage.timestamp)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <p className={clsx(
              'text-sm truncate flex-1',
              hasUnread ? 'text-gray-300 font-medium' : 'text-gray-500'
            )}>
              {lastMessage?.content ? (
                <>
                  {lastMessage.sender?.name !== info.name && conversation.type === 'group' && (
                    <span className="text-gray-400">{lastMessage.sender?.name}: </span>
                  )}
                  {truncateText(lastMessage.content, 40)}
                </>
              ) : (
                <span className="italic">No messages yet</span>
              )}
            </p>

            {conversation.type === 'group' && (
              <span className="text-xs text-gray-500 ml-2">
                {conversation.participants?.length || 0}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  )
}

// Loading skeleton
const ConversationSkeleton = () => (
  <div className="flex items-center gap-3 p-3">
    <div className="w-12 h-12 rounded-full bg-gray-700 animate-pulse" />
    <div className="flex-1 space-y-2">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-600 rounded w-1/3 animate-pulse" />
        <div className="h-3 bg-gray-700 rounded w-12 animate-pulse" />
      </div>
      <div className="h-3 bg-gray-700 rounded w-2/3 animate-pulse" />
    </div>
  </div>
)

// Empty state
const EmptyConversationList = ({ searchQuery, filterBy, onNewChat }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center h-64 p-8"
  >
    <div className="text-center">
      {searchQuery ? (
        <>
          <Search className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            No results found
          </h3>
          <p className="text-gray-500 text-sm">
            No conversations match "{searchQuery}"
          </p>
        </>
      ) : (
        <>
          <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            {filterBy === 'all' ? 'No conversations yet' : `No ${filterBy} conversations`}
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            Start a new conversation to get chatting!
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={onNewChat}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Start New Chat
          </Button>
        </>
      )}
    </div>
  </motion.div>
)

export default ConversationList
