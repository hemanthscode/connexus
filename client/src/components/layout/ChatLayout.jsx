import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Phone, 
  Video, 
  MoreVertical, 
  Search,
  Pin,
  Archive,
  Trash2,
  UserPlus,
  Settings,
  Info
} from 'lucide-react'
import { clsx } from 'clsx'
import Button from '../ui/Button.jsx'
import Dropdown, { DropdownItem, DropdownSeparator } from '../ui/Dropdown.jsx'

const ChatLayout = ({
  children,
  conversation = null,
  user = null,
  onCall,
  onVideoCall,
  onSearchToggle,
  onTogglePin,
  onArchive,
  onDelete,
  onAddParticipants,
  onConversationSettings,
  onConversationInfo,
  isSearchOpen = false,
  showHeader = true,
  className = '',
  headerClassName = '',
  contentClassName = '',
  ...props
}) => {
  const [showInfo, setShowInfo] = useState(false)
  const headerRef = useRef(null)

  const getConversationName = () => {
    if (!conversation) return 'Select a conversation'
    
    if (conversation.type === 'group') {
      return conversation.name || 'Unnamed Group'
    }
    
    // For direct conversations, show other participant's name
    const otherParticipant = conversation.participants?.find(
      p => p.user._id !== user?._id
    )
    
    return otherParticipant?.user?.name || 'Unknown User'
  }

  const getConversationAvatar = () => {
    if (!conversation) return null
    
    if (conversation.type === 'group') {
      return conversation.avatar
    }
    
    const otherParticipant = conversation.participants?.find(
      p => p.user._id !== user?._id
    )
    
    return otherParticipant?.user?.avatar
  }

  const getOnlineStatus = () => {
    if (!conversation || conversation.type === 'group') return null
    
    const otherParticipant = conversation.participants?.find(
      p => p.user._id !== user?._id
    )
    
    return otherParticipant?.user?.status || 'offline'
  }

  const getLastSeen = () => {
    if (!conversation || conversation.type === 'group') return null
    
    const otherParticipant = conversation.participants?.find(
      p => p.user._id !== user?._id
    )
    
    const lastSeen = otherParticipant?.user?.lastSeen
    if (!lastSeen) return null
    
    const date = new Date(lastSeen)
    const now = new Date()
    const diffInMinutes = (now - date) / (1000 * 60)
    
    if (diffInMinutes <= 5) return 'Active now'
    if (diffInMinutes <= 60) return `Active ${Math.floor(diffInMinutes)} minutes ago`
    if (diffInMinutes <= 24 * 60) return `Active ${Math.floor(diffInMinutes / 60)} hours ago`
    
    return `Last seen ${date.toLocaleDateString()}`
  }

  const getParticipantCount = () => {
    if (!conversation || conversation.type !== 'group') return null
    return conversation.participants?.length || 0
  }

  // Chat menu items
  const getChatMenuItems = () => {
    const items = [
      {
        label: 'Conversation Info',
        icon: <Info className="w-4 h-4" />,
        onClick: () => {
          setShowInfo(!showInfo)
          onConversationInfo?.()
        }
      },
      {
        label: 'Search Messages',
        icon: <Search className="w-4 h-4" />,
        onClick: onSearchToggle
      }
    ]

    if (conversation) {
      items.push({
        label: conversation.isPinned ? 'Unpin Chat' : 'Pin Chat',
        icon: <Pin className="w-4 h-4" />,
        onClick: onTogglePin
      })

      if (conversation.type === 'group') {
        items.push(
          { type: 'separator' },
          {
            label: 'Add Participants',
            icon: <UserPlus className="w-4 h-4" />,
            onClick: onAddParticipants
          },
          {
            label: 'Group Settings',
            icon: <Settings className="w-4 h-4" />,
            onClick: onConversationSettings
          }
        )
      }

      items.push(
        { type: 'separator' },
        {
          label: conversation.isArchived ? 'Unarchive' : 'Archive',
          icon: <Archive className="w-4 h-4" />,
          onClick: onArchive
        },
        {
          label: 'Delete Chat',
          icon: <Trash2 className="w-4 h-4" />,
          onClick: onDelete,
          variant: 'danger'
        }
      )
    }

    return items
  }

  const name = getConversationName()
  const avatar = getConversationAvatar()
  const onlineStatus = getOnlineStatus()
  const lastSeen = getLastSeen()
  const participantCount = getParticipantCount()

  return (
    <div className={clsx('h-full flex flex-col', className)} {...props}>
      {/* Chat Header */}
      {showHeader && (
        <motion.header
          ref={headerRef}
          className={clsx(
            'glass-dark border-b border-gray-700/50 backdrop-blur-xl',
            'px-4 py-3 flex items-center justify-between',
            'sticky top-0 z-30',
            headerClassName
          )}
          initial={{ y: -60 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* Left Section - Conversation Info */}
          <motion.div
            className="flex items-center gap-3 flex-1 min-w-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {conversation ? (
              <>
                {/* Avatar */}
                <div className="flex-shrink-0 relative">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  {/* Online indicator for direct chats */}
                  {conversation.type === 'direct' && onlineStatus === 'online' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-dark-surface" />
                  )}
                </div>

                {/* Name and Status */}
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-white truncate">
                    {name}
                  </h2>
                  <p className="text-sm text-gray-400 truncate">
                    {conversation.type === 'group' ? (
                      `${participantCount} participants`
                    ) : (
                      onlineStatus === 'online' ? 'Active now' : lastSeen
                    )}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-600 animate-pulse" />
                <div>
                  <div className="h-4 w-32 bg-gray-600 rounded animate-pulse mb-1" />
                  <div className="h-3 w-24 bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            )}
          </motion.div>

          {/* Right Section - Actions */}
          {conversation && (
            <motion.div
              className="flex items-center gap-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Call Buttons (only for direct chats) */}
              {conversation.type === 'direct' && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onCall}
                    className="w-9 h-9"
                  >
                    <Phone className="w-5 h-5" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onVideoCall}
                    className="w-9 h-9"
                  >
                    <Video className="w-5 h-5" />
                  </Button>
                </>
              )}

              {/* Search Toggle */}
              <Button
                variant={isSearchOpen ? 'primary' : 'ghost'}
                size="icon"
                onClick={onSearchToggle}
                className="w-9 h-9"
              >
                <Search className="w-5 h-5" />
              </Button>

              {/* More Options Menu */}
              <Dropdown
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-9 h-9"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                }
                placement="bottom-end"
              >
                {getChatMenuItems().map((item, index) => (
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
              </Dropdown>
            </motion.div>
          )}
        </motion.header>
      )}

      {/* Main Content Area */}
      <div className={clsx('flex-1 overflow-hidden relative', contentClassName)}>
        <AnimatePresence mode="wait">
          {conversation ? (
            <motion.div
              key={conversation._id}
              className="h-full"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          ) : (
            <motion.div
              className="h-full flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center max-w-md mx-auto p-8">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">💬</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Welcome to Connexus
                </h3>
                <p className="text-gray-400 mb-6">
                  Select a conversation from the sidebar to start chatting, or create a new one to get started.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="primary"
                    onClick={onAddParticipants}
                    leftIcon={<UserPlus className="w-4 h-4" />}
                  >
                    Start New Chat
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={onConversationSettings}
                    leftIcon={<Settings className="w-4 h-4" />}
                  >
                    Settings
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Conversation Info Sidebar */}
      <AnimatePresence>
        {showInfo && conversation && (
          <motion.div
            className="absolute top-0 right-0 w-80 h-full glass-dark border-l border-gray-700/50 backdrop-blur-xl z-40"
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="p-4 border-b border-gray-700/30">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">
                  {conversation.type === 'group' ? 'Group Info' : 'Contact Info'}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowInfo(false)}
                  className="w-8 h-8"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full mx-auto mb-3">
                  {avatar ? (
                    <img src={avatar} alt={name} className="w-full h-full rounded-full" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-xl">
                        {name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <h4 className="text-lg font-semibold text-white mb-1">{name}</h4>
                {conversation.type === 'group' ? (
                  <p className="text-sm text-gray-400">{participantCount} participants</p>
                ) : (
                  <p className="text-sm text-gray-400">{lastSeen}</p>
                )}
              </div>
              
              {/* Additional info content would go here */}
              <div className="space-y-4 text-sm text-gray-400">
                <p>Conversation info and settings will be displayed here.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ChatLayout
