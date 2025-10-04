/**
 * Chat Window Component - OPTIMIZED with Group Settings
 * Enhanced with GroupSettings integration
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, X, Settings, Info } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import { useInfiniteMessages } from '../../hooks/useInfiniteMessages';
import { useConversationInfo } from '../../hooks/useConversationInfo';
import { shouldGroupMessages } from '../../utils/chatHelpers';
import { getInitials } from '../../utils/formatters';
import Button from '../ui/Button';
import Loading from '../ui/Loading';
import Avatar from '../ui/Avatar';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import GroupSettings from '../groups/GroupSettings'; // Group components import

const ChatWindow = () => {
  const messagesEndRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  
  // GROUP SETTINGS STATE
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  
  const { user } = useAuth();
  const { 
    activeConversationId,
    currentConversation,
    currentConversationId,
    replyToMessage,
    clearReplyToMessage,
    markConversationAsRead,
    updateConversation // Add this to handle group updates
  } = useChat();
  
  const { getTypingUsers } = useSocket();
  
  // Use infinite messages hook for pagination
  const {
    messages,
    hasMore,
    isLoadingMore,
    loadMore
  } = useInfiniteMessages(currentConversationId);

  const conversationInfo = useConversationInfo(currentConversation);
  const displayConversationId = currentConversationId;

  // Auto-scroll for new messages
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, shouldAutoScroll]);

  // Auto-scroll for typing indicator changes
  useEffect(() => {
    const typingUsers = getTypingUsers(displayConversationId);
    
    if (shouldAutoScroll && typingUsers && typingUsers.length > 0 && messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [getTypingUsers(displayConversationId)?.length, shouldAutoScroll, displayConversationId]);

  // Mark messages as read when conversation becomes active
  useEffect(() => {
    if (activeConversationId && messages.length > 0) {
      const timer = setTimeout(() => {
        markConversationAsRead(activeConversationId);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeConversationId, messages.length, markConversationAsRead]);

  // Handle scroll for pagination
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setShouldAutoScroll(isNearBottom);
    
    if (scrollTop === 0 && hasMore && !isLoadingMore) {
      loadMore();
    }
  };

  // Reset scroll state when changing conversations
  useEffect(() => {
    setShouldAutoScroll(true);
  }, [displayConversationId]);

  // GROUP SETTINGS HANDLERS
  const handleGroupUpdate = (updatedGroup) => {
    // Update the conversation with new group data
    updateConversation(updatedGroup._id, updatedGroup);
  };

  const handleGroupDeleted = () => {
    setShowGroupSettings(false);
    // The group deletion will be handled by the chat hook
  };

  // Get user's role in the group (if applicable)
  const userParticipant = currentConversation?.type === 'group' 
    ? currentConversation.participants?.find(p => p.user._id === user._id)
    : null;

  // Welcome screen
  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white/2 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-12 h-12 text-white/50" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to Connexus</h2>
          <p className="text-gray-300 mb-4">Select a conversation or search for users to start chatting</p>
          <div className="text-sm text-gray-400 space-y-1">
            <p>🚀 Real-time messaging</p>
            <p>⚡ Instant notifications</p>
            <p>🎯 Live typing indicators</p>
            <p>👥 Group conversations</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white/2 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <Avatar
              src={conversationInfo.avatar}
              name={conversationInfo.name}
              type={conversationInfo.type}
              size="lg"
              isOnline={conversationInfo.isOnline}
              showOnlineStatus={conversationInfo.type === 'direct'}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-semibold text-white truncate">
                  {conversationInfo.name}
                </h1>
                {currentConversation.isTemporary && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-xs bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 px-2 py-1 rounded-full border border-blue-500/30"
                  >
                    New Chat
                  </motion.span>
                )}
                {currentConversation.type === 'group' && userParticipant && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                    userParticipant.role === 'admin' 
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      : userParticipant.role === 'moderator'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                  }`}>
                    {userParticipant.role}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 truncate">
                {currentConversation.isTemporary 
                  ? 'Start by sending a message' 
                  : conversationInfo.status
                }
              </p>
            </div>
          </div>

          {/* GROUP ACTIONS */}
          {currentConversation.type === 'group' && !currentConversation.isTemporary && (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGroupSettings(true)}
                className="p-2"
                title="Group Settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* DIRECT CHAT INFO (Optional) */}
          {currentConversation.type === 'direct' && !currentConversation.isTemporary && (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="p-2"
                title="Chat Info"
                disabled
              >
                <Info className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Reply Preview */}
      <AnimatePresence>
        {replyToMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 border-b border-white/10 bg-blue-500/10"
          >
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-1 h-10 bg-blue-500 rounded-full flex-shrink-0"></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-blue-300 font-medium">
                    Replying to {replyToMessage.sender?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-300 truncate">
                    {replyToMessage.content}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearReplyToMessage}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div 
          onScroll={handleScroll}
          className="h-full overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
        >
          {isLoadingMore && (
            <div className="flex justify-center mb-4">
              <Loading size="sm" />
            </div>
          )}

          <div className="space-y-4">
            {/* Welcome message for temporary conversations */}
            {currentConversation.isTemporary && messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-2xl font-bold text-white">
                    {getInitials(conversationInfo.name)}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Start chatting with {conversationInfo.name}
                </h3>
                <p className="text-gray-300 text-sm max-w-md mx-auto leading-relaxed">
                  Send your first message to begin the conversation. Once you send a message, 
                  this chat will be saved and appear in your conversations list.
                </p>
                <div className="mt-6 flex justify-center">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2">
                    <p className="text-blue-300 text-xs">✨ Your conversation will be created automatically</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Group welcome message for new groups */}
            {currentConversation.type === 'group' && !currentConversation.isTemporary && messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Welcome to {conversationInfo.name}
                </h3>
                <p className="text-gray-300 text-sm max-w-md mx-auto leading-relaxed mb-4">
                  This is the beginning of your group conversation. 
                  {currentConversation.participants?.length > 1 && 
                    ` ${currentConversation.participants.length} members can see messages here.`
                  }
                </p>
                <div className="flex justify-center space-x-4 text-xs">
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-2">
                    <p className="text-purple-300">👥 Group Chat</p>
                  </div>
                  {userParticipant?.role === 'admin' && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2">
                      <p className="text-yellow-300">👑 You're an admin</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <AnimatePresence initial={false}>
              {messages.map((message, index) => {
                const prevMessage = messages[index - 1];
                const isGrouped = shouldGroupMessages(message, prevMessage);

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

            <TypingIndicator conversationId={displayConversationId} />
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0">
        <MessageInput conversationId={displayConversationId} />
      </div>

      {/* GROUP SETTINGS MODAL */}
      {currentConversation.type === 'group' && (
        <GroupSettings
          group={currentConversation}
          isOpen={showGroupSettings}
          onClose={() => setShowGroupSettings(false)}
          onUpdate={handleGroupUpdate}
          onDelete={handleGroupDeleted}
        />
      )}
    </div>
  );
};

export default ChatWindow;
