import { useState, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Phone, Video, MoreVertical, Search, Pin, Archive, Trash2, 
  UserPlus, Settings, Info
} from 'lucide-react'
import { clsx } from 'clsx'
import Button from '../ui/Button.jsx'
import Dropdown, { DropdownItem, DropdownSeparator } from '../ui/Dropdown.jsx'

// Configuration constants
const CHAT_CONFIG = {
  ANIMATION_DURATION: 0.3,
  INFO_SIDEBAR_WIDTH: 320,
  WELCOME_ANIMATION_DURATION: 4
}

const MENU_ITEMS = {
  COMMON: [
    { label: 'Conversation Info', icon: Info, action: 'info' },
    { label: 'Search Messages', icon: Search, action: 'search' }
  ],
  GROUP: [
    { type: 'separator' },
    { label: 'Add Participants', icon: UserPlus, action: 'addParticipants' },
    { label: 'Group Settings', icon: Settings, action: 'groupSettings' }
  ],
  ACTIONS: [
    { type: 'separator' },
    { label: 'Archive', icon: Archive, action: 'archive' },
    { label: 'Delete Chat', icon: Trash2, action: 'delete', variant: 'danger' }
  ]
}

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

  // Memoized conversation data
  const conversationData = useMemo(() => {
    if (!conversation) return null

    if (conversation.type === 'group') {
      return {
        name: conversation.name || 'Unnamed Group',
        avatar: conversation.avatar,
        subtitle: `${conversation.participants?.length || 0} participants`,
        isGroup: true,
        canCall: false
      }
    }

    // Direct conversation
    const otherParticipant = conversation.participants?.find(p => p.user._id !== user?._id)
    
    if (!otherParticipant) {
      return {
        name: 'Unknown User',
        avatar: null,
        subtitle: 'Offline',
        isGroup: false,
        canCall: false,
        onlineStatus: 'offline'
      }
    }

    const lastSeen = otherParticipant.user?.lastSeen
    const isOnline = otherParticipant.user?.status === 'online'
    
    let subtitle = 'Offline'
    if (isOnline) {
      subtitle = 'Active now'
    } else if (lastSeen) {
      const date = new Date(lastSeen)
      const now = new Date()
      const diffInMinutes = (now - date) / (1000 * 60)
      
      if (diffInMinutes <= 5) subtitle = 'Active now'
      else if (diffInMinutes <= 60) subtitle = `Active ${Math.floor(diffInMinutes)} minutes ago`
      else if (diffInMinutes <= 24 * 60) subtitle = `Active ${Math.floor(diffInMinutes / 60)} hours ago`
      else subtitle = `Last seen ${date.toLocaleDateString()}`
    }

    return {
      name: otherParticipant.user.name || 'Unknown User',
      avatar: otherParticipant.user.avatar,
      subtitle,
      isGroup: false,
      canCall: true,
      onlineStatus: otherParticipant.user?.status || 'offline'
    }
  }, [conversation, user])

  // Memoized menu items
  const menuItems = useMemo(() => {
    if (!conversation) return []

    const actions = {
      info: () => {
        setShowInfo(!showInfo)
        onConversationInfo?.()
      },
      search: onSearchToggle,
      pin: onTogglePin,
      addParticipants: onAddParticipants,
      groupSettings: onConversationSettings,
      archive: onArchive,
      delete: onDelete
    }

    const items = [
      ...MENU_ITEMS.COMMON.map(item => ({
        ...item,
        onClick: actions[item.action]
      })),
      {
        label: conversation.isPinned ? 'Unpin Chat' : 'Pin Chat',
        icon: Pin,
        onClick: actions.pin
      }
    ]

    if (conversation.type === 'group') {
      items.push(...MENU_ITEMS.GROUP.map(item => 
        item.type === 'separator' ? item : { ...item, onClick: actions[item.action] }
      ))
    }

    items.push(
      ...MENU_ITEMS.ACTIONS.map(item => 
        item.type === 'separator' 
          ? item 
          : item.action === 'archive' 
            ? { ...item, label: conversation.isArchived ? 'Unarchive' : 'Archive', onClick: actions[item.action] }
            : { ...item, onClick: actions[item.action] }
      )
    )

    return items
  }, [conversation, showInfo, onConversationInfo, onSearchToggle, onTogglePin, onAddParticipants, onConversationSettings, onArchive, onDelete])

  // Render avatar
  const renderAvatar = useCallback((data, size = 'w-10 h-10') => (
    <div className={`flex-shrink-0 relative ${size}`}>
      {data.avatar ? (
        <img
          src={data.avatar}
          alt={data.name}
          className={`${size} rounded-full ring-2 ring-gray-600/30`}
        />
      ) : (
        <div className={`${size} rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center ring-2 ring-gray-600/30`}>
          <span className="text-white font-semibold text-sm">
            {data.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      
      {data.onlineStatus === 'online' && !data.isGroup && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-dark-surface" />
      )}
    </div>
  ), [])

  // Welcome screen component
  const WelcomeScreen = useMemo(() => (
    <motion.div
      className="h-full flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: CHAT_CONFIG.ANIMATION_DURATION, ease: 'easeInOut' }}
    >
      <div className="text-center max-w-lg mx-auto p-8">
        <motion.div
          className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400/10 to-blue-600/10 border border-cyan-400/20 flex items-center justify-center mx-auto mb-8"
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 1, 0] 
          }}
          transition={{ 
            duration: CHAT_CONFIG.WELCOME_ANIMATION_DURATION,
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-600/20 flex items-center justify-center">
            <span className="text-4xl">💬</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-2xl font-bold text-white mb-3">Welcome to Connexus</h3>
          <p className="text-lg text-gray-300 mb-2">Your conversations await</p>
          <p className="text-gray-400 leading-relaxed">
            Select a conversation from the sidebar to start chatting,<br />
            or create a new chat to connect with someone.
          </p>
        </motion.div>

        <motion.div
          className="flex justify-center gap-2 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-cyan-400/30"
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.8, 0.3] 
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  ), [])

  return (
    <div className={clsx('h-full flex flex-col', className)} {...props}>
      {/* Chat Header */}
      <AnimatePresence>
        {showHeader && conversation && conversationData && (
          <motion.header
            ref={headerRef}
            className={clsx(
              'glass-dark border-b border-gray-700/50 backdrop-blur-xl',
              'px-4 py-3 flex items-center justify-between sticky top-0 z-30',
              headerClassName
            )}
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: CHAT_CONFIG.ANIMATION_DURATION, ease: 'easeOut' }}
          >
            {/* Left Section */}
            <motion.div
              className="flex items-center gap-3 flex-1 min-w-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {renderAvatar(conversationData)}
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-white truncate">{conversationData.name}</h2>
                <p className="text-sm text-gray-400 truncate">{conversationData.subtitle}</p>
              </div>
            </motion.div>

            {/* Right Section */}
            <motion.div
              className="flex items-center gap-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {conversationData.canCall && (
                <>
                  <Button variant="ghost" size="icon" onClick={onCall} className="w-9 h-9" title="Voice call">
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onVideoCall} className="w-9 h-9" title="Video call">
                    <Video className="w-5 h-5" />
                  </Button>
                </>
              )}

              <Button
                variant={isSearchOpen ? 'primary' : 'ghost'}
                size="icon"
                onClick={onSearchToggle}
                className="w-9 h-9"
                title="Search messages"
              >
                <Search className="w-5 h-5" />
              </Button>

              <Dropdown
                trigger={
                  <Button variant="ghost" size="icon" className="w-9 h-9" title="More options">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                }
                placement="bottom-end"
              >
                {menuItems.map((item, index) => (
                  item.type === 'separator' ? (
                    <DropdownSeparator key={index} />
                  ) : (
                    <DropdownItem
                      key={index}
                      onClick={item.onClick}
                      variant={item.variant}
                      leftIcon={<item.icon className="w-4 h-4" />}
                    >
                      {item.label}
                    </DropdownItem>
                  )
                ))}
              </Dropdown>
            </motion.div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className={clsx('flex-1 overflow-hidden relative', contentClassName)}>
        <AnimatePresence mode="wait">
          {conversation ? (
            <motion.div
              key={conversation._id}
              className="h-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {children}
            </motion.div>
          ) : (
            WelcomeScreen
          )}
        </AnimatePresence>
      </div>

      {/* Conversation Info Sidebar */}
      <AnimatePresence>
        {showInfo && conversation && conversationData && (
          <motion.div
            className="absolute top-0 right-0 w-80 h-full glass-dark border-l border-gray-700/50 backdrop-blur-xl z-40"
            initial={{ x: CHAT_CONFIG.INFO_SIDEBAR_WIDTH, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: CHAT_CONFIG.INFO_SIDEBAR_WIDTH, opacity: 0 }}
            transition={{ duration: CHAT_CONFIG.ANIMATION_DURATION, ease: 'easeInOut' }}
          >
            <div className="p-4 border-b border-gray-700/30">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">
                  {conversationData.isGroup ? 'Group Info' : 'Contact Info'}
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
            
            <div className="p-4 overflow-y-auto">
              <div className="text-center mb-6">
                {renderAvatar(conversationData, 'w-20 h-20')}
                <h4 className="text-lg font-semibold text-white mb-1 mt-3">{conversationData.name}</h4>
                <p className="text-sm text-gray-400">{conversationData.subtitle}</p>
              </div>
              
              <div className="space-y-4">
                <div className="glass rounded-lg p-4">
                  <h5 className="text-sm font-medium text-white mb-2">About</h5>
                  <p className="text-sm text-gray-400">
                    {conversationData.isGroup 
                      ? 'Group conversation information and settings will be displayed here.'
                      : 'Contact information and chat settings will be displayed here.'
                    }
                  </p>
                </div>

                {conversationData.isGroup && conversation.participants && (
                  <div className="glass rounded-lg p-4">
                    <h5 className="text-sm font-medium text-white mb-3">Participants</h5>
                    <div className="space-y-2">
                      {conversation.participants.map((participant) => (
                        <div key={participant.user._id} className="flex items-center gap-3">
                          <img
                            src={participant.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(participant.user.name || 'U')}&size=32`}
                            alt={participant.user.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {participant.user.name}
                            </p>
                          </div>
                          {participant.role === 'admin' && (
                            <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                              Admin
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ChatLayout
