import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Hash,
  Users,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import { getInitials } from '../../utils/formatters';
import Button from '../ui/Button';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';

const ChatWindow = () => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  
  const { user } = useAuth();
  const { 
    messages, 
    activeConversationId,
    temporaryConversation,
    currentConversation,
    currentConversationId,
    loadMessages,
    replyToMessage,
    clearReplyToMessage,
    markConversationAsRead
  } = useChat();
  
  const { 
    getTypingUsers,
    isUserOnline 
  } = useSocket();

  const displayConversation = currentConversation;
  const displayConversationId = currentConversationId;
  const typingUsers = getTypingUsers(displayConversationId);

  // Smart auto-scroll for new messages
  useEffect(() => {
    if (messages.length > lastMessageCount && shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    setLastMessageCount(messages.length);
  }, [messages.length, shouldAutoScroll]);

  // Auto-scroll for typing indicators
  useEffect(() => {
    if (typingUsers.length > 0 && shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [typingUsers.length, shouldAutoScroll]);

  // Mark messages as read when conversation becomes active
  useEffect(() => {
    if (activeConversationId && messages.length > 0) {
      const timer = setTimeout(() => {
        markConversationAsRead(activeConversationId);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeConversationId, messages.length, markConversationAsRead]);

  // Mark messages as read on window focus/visibility
  useEffect(() => {
    const handleFocus = () => {
      if (activeConversationId) {
        markConversationAsRead(activeConversationId);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && activeConversationId) {
        markConversationAsRead(activeConversationId);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeConversationId, markConversationAsRead]);

  // Handle scroll and pagination
  const handleScroll = async (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setShouldAutoScroll(isNearBottom);
    
    // Load more messages for real conversations only
    if (scrollTop === 0 && !isLoadingMore && messages.length >= 50 && activeConversationId && !activeConversationId.startsWith('temp_')) {
      setIsLoadingMore(true);
      const currentPage = Math.ceil(messages.length / 50) + 1;
      const scrollHeightBefore = scrollHeight;
      
      await loadMessages(activeConversationId, currentPage);
      
      setTimeout(() => {
        if (messagesContainerRef.current) {
          const scrollHeightAfter = messagesContainerRef.current.scrollHeight;
          const scrollDiff = scrollHeightAfter - scrollHeightBefore;
          messagesContainerRef.current.scrollTop = scrollDiff;
        }
        setIsLoadingMore(false);
      }, 100);
    }
  };

  // Reset scroll state when changing conversations
  useEffect(() => {
    setShouldAutoScroll(true);
    setLastMessageCount(0);
  }, [displayConversationId]);

  const getConversationName = () => {
    if (!displayConversation) return 'Select a conversation';
    
    if (displayConversation.type === 'group') {
      return displayConversation.name || 'Group Chat';
    }
    
    const otherParticipant = displayConversation.participants?.find(
      p => p.user?._id !== user?._id
    );
    return otherParticipant?.user?.name || 'Unknown User';
  };

  const getConversationAvatar = () => {
    if (!displayConversation) return null;
    
    if (displayConversation.type === 'group') {
      return displayConversation.avatar;
    }
    
    const otherParticipant = displayConversation.participants?.find(
      p => p.user?._id !== user?._id
    );
    return otherParticipant?.user?.avatar;
  };

  const getParticipantStatus = () => {
    if (!displayConversation || displayConversation.type === 'group') {
      return `${displayConversation?.participants?.length || 0} members`;
    }
    
    const otherParticipant = displayConversation.participants?.find(
      p => p.user?._id !== user?._id
    );
    
    if (!otherParticipant) return 'Unknown';
    
    const isOnline = isUserOnline(otherParticipant.user._id);
    return isOnline ? 'Online' : 'Offline';
  };

  // Show welcome screen if no conversation selected
  if (!displayConversation) {
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
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white/2 overflow-hidden">
      {/* Clean Header - No Unnecessary Buttons */}
      <div className="flex-shrink-0 border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            {/* Avatar - Clickable for Profile */}
            <button
              className="relative flex-shrink-0 hover:opacity-80 transition-opacity"
              onClick={() => {
                // TODO: Open profile modal for the other participant
                console.log('Open profile for:', getConversationName());
              }}
            >
              {displayConversation.type === 'group' ? (
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                  <Hash className="w-6 h-6 text-white" />
                </div>
              ) : (
                <>
                  {getConversationAvatar() ? (
                    <img 
                      src={getConversationAvatar()} 
                      alt={getConversationName()} 
                      className="w-12 h-12 rounded-xl object-cover shadow-md"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-white font-medium">
                        {getInitials(getConversationName())}
                      </span>
                    </div>
                  )}
                  {displayConversation.type === 'direct' && getParticipantStatus() === 'Online' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                  )}
                </>
              )}
            </button>

            {/* Conversation Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-semibold text-white truncate">
                  {getConversationName()}
                </h1>
                {/* Temporary conversation indicator */}
                {displayConversation.isTemporary && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-xs bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 px-2 py-1 rounded-full border border-blue-500/30"
                  >
                    New Chat
                  </motion.span>
                )}
              </div>
              <p className="text-sm text-gray-400 truncate">
                {displayConversation.isTemporary 
                  ? 'Start by sending a message' 
                  : getParticipantStatus()
                }
              </p>
            </div>
          </div>
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
                className="p-1 text-gray-400 hover:text-white transition-colors flex-shrink-0"
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
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
        >
          {/* Loading indicator for pagination */}
          {isLoadingMore && !displayConversation.isTemporary && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center mb-4"
            >
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </motion.div>
          )}

          <div className="space-y-4">
            {/* Welcome message for temporary conversations */}
            {displayConversation.isTemporary && messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-2xl font-bold text-white">
                    {getInitials(getConversationName())}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Start chatting with {getConversationName()}
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

            {/* Messages */}
            <AnimatePresence initial={false}>
              {messages.map((message, index) => {
                const prevMessage = messages[index - 1];
                const isGrouped = prevMessage && 
                  prevMessage.sender?._id === message.sender?._id &&
                  (new Date(message.createdAt) - new Date(prevMessage.createdAt)) < 300000;

                return (
                  <MessageItem
                    key={message._id}
                    message={message}
                    isGrouped={isGrouped}
                    isOwn={message.sender?._id === user?._id}
                  />
                );
              })}
            </AnimatePresence>

            {/* Typing Indicator */}
            <TypingIndicator 
              typingUsers={typingUsers} 
              conversationId={displayConversationId}
            />

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0">
        <MessageInput conversationId={displayConversationId} />
      </div>
    </div>
  );
};

export default ChatWindow;
