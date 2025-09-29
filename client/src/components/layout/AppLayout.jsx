import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import Header from '../ui/Header.jsx'
import Sidebar from '../ui/Sidebar.jsx'
import { useToast } from '../ui/Toast.jsx'

// Configuration constants
const LAYOUT_CONFIG = {
  SIDEBAR_WIDTH: 320,
  MOBILE_BREAKPOINT: 1024,
  CONNECTION_TOAST_DURATION: 2000,
  ANIMATION_DURATION: 0.3
}

const CONNECTION_STATUS_CONFIG = {
  connecting: {
    color: 'bg-yellow-500/95',
    icon: 'spinner',
    text: 'Reconnecting...'
  },
  disconnected: {
    color: 'bg-red-500/95', 
    icon: 'dot',
    text: 'No internet connection'
  }
}

const AppLayout = ({
  children,
  user = null,
  conversations = [],
  activeConversationId = null,
  onConversationSelect,
  onLogout,
  onSettings,
  onProfileClick,
  onNewChat,
  onNewGroup,
  connectionStatus = 'connected',
  className = '',
  sidebarProps = {},
  headerProps = {},
  ...props
}) => {
  // Consolidated state
  const [state, setState] = useState({
    sidebarOpen: true,
    sidebarSection: 'chats',
    isMobile: false
  })
  
  const toast = useToast()

  // Memoized responsive logic
  const responsiveConfig = useMemo(() => {
    const checkMobile = () => window.innerWidth < LAYOUT_CONFIG.MOBILE_BREAKPOINT
    return { checkMobile }
  }, [])

  // Check mobile and set initial state
  useEffect(() => {
    const updateLayout = () => {
      const isMobile = responsiveConfig.checkMobile()
      setState(prev => ({
        ...prev,
        isMobile,
        sidebarOpen: isMobile ? false : true
      }))
    }
    
    updateLayout()
    window.addEventListener('resize', updateLayout)
    
    return () => window.removeEventListener('resize', updateLayout)
  }, [responsiveConfig])

  // Auto-close sidebar on mobile when conversation is selected
  useEffect(() => {
    if (state.isMobile && activeConversationId) {
      setState(prev => ({ ...prev, sidebarOpen: false }))
    }
  }, [activeConversationId, state.isMobile])

  // Connection status notifications
  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      toast.error('Connection lost. Trying to reconnect...', { duration: 0 })
    } else if (connectionStatus === 'connected') {
      toast.success('Connected', { duration: LAYOUT_CONFIG.CONNECTION_TOAST_DURATION })
    }
  }, [connectionStatus, toast])

  // Memoized handlers
  const handlers = useMemo(() => ({
    handleSidebarToggle: () => {
      setState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }))
    },
    handleSidebarClose: () => {
      setState(prev => ({ ...prev, sidebarOpen: false }))
    },
    handleSectionChange: (section) => {
      setState(prev => ({ ...prev, sidebarSection: section }))
    }
  }), [])

  // Sidebar animation config
  const sidebarAnimation = useMemo(() => ({
    initial: { 
      x: state.isMobile ? -LAYOUT_CONFIG.SIDEBAR_WIDTH : 0,
      opacity: state.isMobile ? 0 : 1 
    },
    animate: { x: 0, opacity: 1 },
    exit: { 
      x: state.isMobile ? -LAYOUT_CONFIG.SIDEBAR_WIDTH : -LAYOUT_CONFIG.SIDEBAR_WIDTH,
      opacity: state.isMobile ? 0 : 1 
    },
    transition: { duration: LAYOUT_CONFIG.ANIMATION_DURATION, ease: 'easeInOut' }
  }), [state.isMobile])

  // Render connection status overlay
  const renderConnectionStatus = useCallback((status) => {
    const config = CONNECTION_STATUS_CONFIG[status]
    if (!config) return null

    return (
      <motion.div
        className={`fixed top-0 left-0 right-0 z-50 ${config.color} backdrop-blur-sm shadow-lg`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        exit={{ y: -100 }}
        transition={{ duration: LAYOUT_CONFIG.ANIMATION_DURATION }}
      >
        <div className="flex items-center justify-center py-3 px-4">
          {config.icon === 'spinner' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-transparent border-t-white mr-3" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-white mr-3" />
          )}
          <span className="text-white text-sm font-medium">{config.text}</span>
        </div>
      </motion.div>
    )
  }, [])

  return (
    <div className={clsx('h-screen bg-dark-bg flex overflow-hidden relative', className)} {...props}>
      {/* Sidebar */}
      <AnimatePresence>
        {state.sidebarOpen && (
          <motion.div
            {...sidebarAnimation}
            className={clsx(
              'bg-dark-surface border-r border-gray-700/50',
              state.isMobile 
                ? 'fixed top-0 left-0 h-full w-80 z-40 shadow-2xl' 
                : 'relative w-80 flex-shrink-0'
            )}
          >
            <Sidebar
              isOpen={true}
              onToggle={handlers.handleSidebarToggle}
              onClose={handlers.handleSidebarClose}
              activeSection={state.sidebarSection}
              onSectionChange={handlers.handleSectionChange}
              conversations={conversations}
              onConversationSelect={onConversationSelect}
              activeConversationId={activeConversationId}
              onNewChat={onNewChat}
              onNewGroup={onNewGroup}
              user={user}
              isMobile={state.isMobile}
              className="h-full"
              {...sidebarProps}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {state.isMobile && state.sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: LAYOUT_CONFIG.ANIMATION_DURATION }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
            onClick={handlers.handleSidebarClose}
          />
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <div className="flex-shrink-0 z-20 relative">
          <Header
            user={user}
            onMenuToggle={handlers.handleSidebarToggle}
            onLogout={onLogout}
            onSettings={onSettings}
            onProfileClick={onProfileClick}
            connectionStatus={connectionStatus}
            sidebarOpen={state.sidebarOpen}
            isMobile={state.isMobile}
            {...headerProps}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden relative bg-dark-bg">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeConversationId || 'welcome'}
              className="h-full w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Connection Status Overlays */}
      <AnimatePresence>
        {(connectionStatus === 'connecting' || connectionStatus === 'disconnected') && 
          renderConnectionStatus(connectionStatus)}
      </AnimatePresence>
    </div>
  )
}

export default AppLayout
