import { useState, useEffect, useCallback, useRef } from 'react' // ADDED useRef
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Settings, User, LogOut } from 'lucide-react'
import { clsx } from 'clsx'
import AppLayout from '@/components/layout/AppLayout.jsx'
import ChatLayout from '@/components/layout/ChatLayout.jsx'
import ConversationList from '@/components/chat/ConversationList.jsx'
import MessageList, { EmptyMessageList } from '@/components/chat/MessageList.jsx'
import MessageInput from '@/components/chat/MessageInput.jsx'
import UserSearch from '@/components/chat/UserSearch.jsx'
import ConversationHeader from '@/components/chat/ConversationHeader.jsx'
import ReplyPreview from '@/components/chat/ReplyPreview.jsx'
import { useChat } from '@/hooks/useChat.jsx'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useSocket } from '@/hooks/useSocket.jsx'
import { useUI, useUIActions } from '@/store/uiSlice.js'
import { useToast } from '@/components/ui/Toast.jsx'

const ChatPage = () => {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const { user, logout } = useAuth()
  const { 
    conversations, 
    setActiveConversation, 
    activeConversationId,
    getConversationById,
    isInitialized 
  } = useChat()
  const { connectionStatus } = useSocket()
  const { 
    userSelectModal, 
    settingsModal,
    profileModal 
  } = useUI()
  const { 
    openUserSelectModal, 
    closeUserSelectModal,
    openSettingsModal,
    openProfileModal 
  } = useUIActions()

  // Local state
  const [replyToMessage, setReplyToMessage] = useState(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // FIXED: Prevent navigation loops by using refs
  const lastConversationIdRef = useRef(conversationId)
  const lastActiveConversationIdRef = useRef(activeConversationId)

  // Set active conversation from URL - FIXED: Only when actually different
  useEffect(() => {
    if (conversationId !== lastConversationIdRef.current) {
      lastConversationIdRef.current = conversationId
      
      if (conversationId && conversationId !== activeConversationId) {
        console.log('Setting active conversation from URL:', conversationId)
        setActiveConversation(conversationId)
      } else if (!conversationId && activeConversationId) {
        console.log('Clearing active conversation')
        setActiveConversation(null)
      }
    }
  }, [conversationId, activeConversationId, setActiveConversation])

  // Navigate to conversation when active changes - FIXED: Prevent loops
  useEffect(() => {
    if (activeConversationId !== lastActiveConversationIdRef.current) {
      lastActiveConversationIdRef.current = activeConversationId
      
      if (activeConversationId && activeConversationId !== conversationId) {
        console.log('Navigating to conversation:', activeConversationId)
        navigate(`/chat/${activeConversationId}`, { replace: true })
      } else if (!activeConversationId && conversationId) {
        console.log('Navigating to chat root')
        navigate('/chat', { replace: true })
      }
    }
  }, [activeConversationId, conversationId, navigate])

  // Get active conversation
  const activeConversation = getConversationById(activeConversationId)

  // Handle conversation selection
  const handleConversationSelect = useCallback((selectedConversationId) => {
    if (selectedConversationId !== activeConversationId) {
      setActiveConversation(selectedConversationId)
    }
  }, [setActiveConversation, activeConversationId])

  // Handle new chat
  const handleNewChat = useCallback(() => {
    openUserSelectModal('newChat', (conversation) => {
      setActiveConversation(conversation._id)
      toast.success('New conversation started')
    })
  }, [openUserSelectModal, setActiveConversation, toast])

  // Handle new group
  const handleNewGroup = useCallback(() => {
    openUserSelectModal('newGroup', (group) => {
      setActiveConversation(group._id)
      toast.success('Group created successfully')
    })
  }, [openUserSelectModal, setActiveConversation, toast])

  // Handle message reply
  const handleReply = useCallback((message) => {
    setReplyToMessage(message)
  }, [])

  // Handle cancel reply
  const handleCancelReply = useCallback(() => {
    setReplyToMessage(null)
  }, [])

  // Handle message actions
  const handleCall = useCallback(() => {
    toast.info('Voice calling feature coming soon!')
  }, [toast])

  const handleVideoCall = useCallback(() => {
    toast.info('Video calling feature coming soon!')
  }, [toast])

  const handleSearchToggle = useCallback(() => {
    setIsSearchOpen(!isSearchOpen)
  }, [isSearchOpen])

  const handleConversationInfo = useCallback(() => {
    if (activeConversation) {
      toast.info('Conversation info feature coming soon!')
    }
  }, [activeConversation, toast])

  const handleConversationSettings = useCallback(() => {
    if (activeConversation) {
      toast.info('Conversation settings feature coming soon!')
    }
  }, [activeConversation, toast])

  const handleAddParticipants = useCallback(() => {
    if (activeConversation?.type === 'group') {
      openUserSelectModal('addToGroup', (users) => {
        toast.success(`Added ${users.length} participant(s)`)
      }, { existingGroup: activeConversation })
    }
  }, [activeConversation, openUserSelectModal, toast])

  const handleTogglePin = useCallback(() => {
    toast.info('Pin conversation feature coming soon!')
  }, [toast])

  const handleArchive = useCallback(() => {
    toast.info('Archive conversation feature coming soon!')
  }, [toast])

  const handleDelete = useCallback(() => {
    toast.info('Delete conversation feature coming soon!')
  }, [toast])

  // Header actions
  const handleSettings = useCallback(() => {
    openSettingsModal()
  }, [openSettingsModal])

  const handleProfileClick = useCallback(() => {
    openProfileModal(user?._id)
  }, [openProfileModal, user?._id])

  const handleLogout = useCallback(async () => {
    const confirmed = window.confirm('Are you sure you want to sign out?')
    if (confirmed) {
      await logout()
      navigate('/login')
    }
  }, [logout, navigate])

  // Loading state
  if (!isInitialized) {
    return (
      <div className="h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-cyan-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading your conversations...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <AppLayout
        user={user}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onConversationSelect={handleConversationSelect}
        onLogout={handleLogout}
        onSettings={handleSettings}
        onProfileClick={handleProfileClick}
        onNewChat={handleNewChat}
        onNewGroup={handleNewGroup}
        connectionStatus={connectionStatus}
      >
        <ChatLayout
          conversation={activeConversation}
          user={user}
          onCall={handleCall}
          onVideoCall={handleVideoCall}
          onSearchToggle={handleSearchToggle}
          onConversationInfo={handleConversationInfo}
          onConversationSettings={handleConversationSettings}
          onAddParticipants={handleAddParticipants}
          onTogglePin={handleTogglePin}
          onArchive={handleArchive}
          onDelete={handleDelete}
          isSearchOpen={isSearchOpen}
          showHeader={true}
        >
          {activeConversation ? (
            <div className="flex flex-col h-full">
              {/* Messages Area */}
              <div className="flex-1 overflow-hidden">
                <MessageList
                  conversationId={activeConversationId}
                  onReply={handleReply}
                  onPin={handleTogglePin}
                  onForward={() => toast.info('Forward message feature coming soon!')}
                  showScrollToBottom={true}
                />
              </div>

              {/* Reply Preview */}
              <AnimatePresence>
                {replyToMessage && (
                  <div className="border-t border-gray-700/50 p-4">
                    <ReplyPreview
                      message={replyToMessage}
                      onCancel={handleCancelReply}
                      compact={false}
                    />
                  </div>
                )}
              </AnimatePresence>

              {/* Message Input */}
              <div className="border-t border-gray-700/50">
                <MessageInput
                  conversationId={activeConversationId}
                  replyToMessage={replyToMessage}
                  onCancelReply={handleCancelReply}
                  disabled={!activeConversation}
                />
              </div>
            </div>
          ) : (
            <EmptyMessageList
              conversationName="someone new"
              onStartChat={handleNewChat}
            />
          )}
        </ChatLayout>
      </AppLayout>

      {/* User Search Modal */}
      <UserSearch
        isOpen={userSelectModal.open}
        onClose={closeUserSelectModal}
        mode={userSelectModal.type}
        onSuccess={userSelectModal.onSelect}
        existingGroup={userSelectModal.existingGroup}
      />
    </>
  )
}

export default ChatPage
