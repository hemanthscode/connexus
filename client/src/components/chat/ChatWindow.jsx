/**
 * Chat Window - REDESIGNED & STREAMLINED
 * Modern chat patterns, essential features only, optimal UX
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ArrowLeft, MoreVertical } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import { useInfiniteMessages } from '../../hooks/useInfiniteMessages';
import { useConversationInfo } from '../../hooks/useConversationInfo';
import { messageHelpers, conversationHelpers, permissionHelpers } from '../../utils/chatHelpers';
import Button from '../ui/Button';
import Loading from '../ui/Loading';
import Avatar from '../ui/Avatar';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import GroupSettings from '../groups/GroupSettings';

const ChatWindow = () => {
  const messagesEndRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const chatMenuRef = useRef(null);
  
  const { user } = useAuth();
  const { 
    activeConversationId, currentConversation, currentConversationId,
    markConversationAsRead, updateConversation, setActiveConversation
  } = useChat();
  
  const { getTypingUsers } = useSocket();
  const { messages, hasMore, isLoadingMore, loadMore } = useInfiniteMessages(currentConversationId);
  const conversationInfo = useConversationInfo(currentConversation);

  // SMART STATUS: Combine online status and typing for cleaner display
  const smartStatus = useMemo(() => {
    if (!currentConversation) return null;
    
    const typingUsers = getTypingUsers(currentConversationId);
    if (typingUsers?.length > 0) {
      const typingNames = typingUsers
        .filter(u => u._id !== user?._id)
        .map(u => u.name || 'Someone')
        .slice(0, 2);
      
      if (typingNames.length === 1) return `${typingNames[0]} is typing...`;
      if (typingNames.length === 2) return `${typingNames[0]} and ${typingNames[1]} are typing...`;
      if (typingNames.length > 2) return `${typingNames[0]} and ${typingNames.length - 1} others are typing...`;
    }
    
    if (currentConversation.isTemporary) return 'Send a message to start chatting';
    if (currentConversation.type === 'direct' && conversationInfo.isOnline) return 'Online';
    if (currentConversation.type === 'group') {
      const memberCount = currentConversation.participants?.length || 0;
      return `${memberCount} member${memberCount !== 1 ? 's' : ''}`;
    }
    
    return conversationInfo.status;
  }, [currentConversation, conversationInfo, getTypingUsers, currentConversationId, user?._id]);

  // CONSOLIDATED EFFECTS
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, shouldAutoScroll]);

  useEffect(() => {
    const typingUsers = getTypingUsers(currentConversationId);
    if (shouldAutoScroll && typingUsers?.length > 0 && messagesEndRef.current) {
      setTimeout(() => messagesEndRef.current.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [getTypingUsers(currentConversationId)?.length, shouldAutoScroll, currentConversationId]);

  useEffect(() => {
    if (activeConversationId && messages.length > 0) {
      const timer = setTimeout(() => markConversationAsRead(activeConversationId), 1000);
      return () => clearTimeout(timer);
    }
  }, [activeConversationId, messages.length, markConversationAsRead]);

  useEffect(() => setShouldAutoScroll(true), [currentConversationId]);

  // Close chat menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (chatMenuRef.current && !chatMenuRef.current.contains(e.target)) {
        setShowChatMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isNearBottom);
    
    if (scrollTop === 0 && hasMore && !isLoadingMore) {
      loadMore();
    }
  };

  // MODERN EMPTY STATE
  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white/2">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">C</span>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">Welcome to Connexus</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            Select a conversation from the sidebar to start chatting, or search for someone new to message.
          </p>
          
          <div className="bg-white/5 rounded-xl p-4 space-y-2">
            <div className="flex items-center space-x-3 text-gray-400 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Real-time messaging</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-400 text-sm">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Group conversations</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-400 text-sm">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Live typing indicators</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const displayName = conversationHelpers.getConversationName(currentConversation, user?._id);
  const userRole = permissionHelpers.getUserRole(currentConversation, user?._id);
  const canManageGroup = currentConversation?.type === 'group' && 
    permissionHelpers.canPerformGroupAction(currentConversation, user?._id, 'manage_settings');

  // CHAT MENU ACTIONS - Only essential ones
  const chatMenuActions = [
    ...(canManageGroup ? [{ 
      key: 'groupSettings', 
      label: 'Group settings', 
      icon: Settings, 
      action: () => setShowGroupSettings(true) 
    }] : [])
  ];

  return (
    <div className="flex-1 flex flex-col bg-white/2 overflow-hidden">
      
      {/* STREAMLINED HEADER */}
      <div className="flex-shrink-0 border-b border-white/10 p-4 bg-white/5 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          
          {/* Main Info */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            {/* Back Button - Mobile responsive */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveConversation(null)}
              className="p-2 md:hidden"
              title="Back to chats"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <Avatar
              src={conversationInfo.avatar}
              name={displayName}
              type={conversationInfo.type}
              size="lg"
              isOnline={conversationInfo.isOnline}
              showOnlineStatus={conversationInfo.type === 'direct' && !currentConversation.isTemporary}
              userId={conversationInfo.userId}
              className="ring-2 ring-white/10"
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h1 className="text-lg font-semibold text-white truncate">
                  {displayName}
                </h1>
                
                {/* STREAMLINED BADGES */}
                {currentConversation.isTemporary && (
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full border border-blue-500/30 flex-shrink-0">
                    New
                  </span>
                )}
                
                {userRole === 'admin' && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full flex-shrink-0">
                    Admin
                  </span>
                )}
              </div>
              
              {/* SMART STATUS */}
              <p className="text-sm text-gray-400 truncate">
                {smartStatus}
              </p>
            </div>
          </div>

          {/* MINIMAL ACTIONS */}
          {chatMenuActions.length > 0 && (
            <div className="relative" ref={chatMenuRef}>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowChatMenu(!showChatMenu)}
                className="p-2"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
              
              <AnimatePresence>
                {showChatMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-gray-900/95 backdrop-blur border border-white/20 rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    {chatMenuActions.map(({ key, label, icon: Icon, action }) => (
                      <Button
                        key={key}
                        variant="ghost"
                        onClick={() => { setShowChatMenu(false); action(); }}
                        className="w-full justify-start px-4 py-3 text-sm rounded-none hover:bg-white/10"
                        leftIcon={<Icon className="w-4 h-4" />}
                      >
                        {label}
                      </Button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div 
          onScroll={handleScroll} 
          className="h-full overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
        >
          {/* Loading indicator */}
          {isLoadingMore && (
            <div className="flex justify-center mb-4">
              <Loading size="sm" text="Loading messages..." />
            </div>
          )}

          {/* STREAMLINED WELCOME MESSAGE */}
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="text-center max-w-sm"
              >
                <Avatar
                  src={conversationInfo.avatar}
                  name={displayName}
                  type={conversationInfo.type}
                  size="2xl"
                  className="mx-auto mb-6 ring-4 ring-white/10"
                />
                
                <h3 className="text-xl font-semibold text-white mb-3">
                  {currentConversation.isTemporary 
                    ? `Say hello to ${displayName}` 
                    : `Welcome to ${displayName}`
                  }
                </h3>
                
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  {currentConversation.isTemporary
                    ? 'This is the beginning of your conversation. Send a message to get started.'
                    : currentConversation.type === 'group'
                      ? `This is the beginning of the ${displayName} group.`
                      : 'This is the beginning of your conversation history.'
                  }
                </p>

                {/* GROUP INFO */}
                {currentConversation.type === 'group' && !currentConversation.isTemporary && (
                  <div className="bg-white/5 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                      <span>{currentConversation.participants?.length || 0} members</span>
                      {userRole === 'admin' && (
                        <>
                          <span>•</span>
                          <span className="text-yellow-400">You're an admin</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* MESSAGES LIST */}
          {messages.length > 0 && (
            <div className="space-y-1">
              <AnimatePresence initial={false}>
                {messages.map((message, index) => {
                  const prevMessage = messages[index - 1];
                  const isGrouped = messageHelpers.shouldGroupMessages(message, prevMessage);

                  return (
                    <MessageItem
                      key={message._id}
                      message={message}
                      isGrouped={isGrouped}
                      isOwn={message.sender?._id === user?._id}
                      showSenderName={currentConversation.type === 'group' && !isGrouped}
                    />
                  );
                })}
              </AnimatePresence>

              <TypingIndicator conversationId={currentConversationId} />
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* MESSAGE INPUT */}
      <MessageInput conversationId={currentConversationId} />

      {/* GROUP SETTINGS MODAL */}
      {currentConversation.type === 'group' && (
        <GroupSettings
          group={currentConversation}
          isOpen={showGroupSettings}
          onClose={() => setShowGroupSettings(false)}
          onUpdate={(updatedGroup) => updateConversation(updatedGroup._id, updatedGroup)}
          onDelete={() => setShowGroupSettings(false)}
        />
      )}
    </div>
  );
};

export default ChatWindow;
