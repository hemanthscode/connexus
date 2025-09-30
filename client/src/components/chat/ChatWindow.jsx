import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MoreVertical, 
  Phone, 
  Video, 
  Info,
  Hash,
  Users
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
    conversations,
    messages, 
    activeConversationId,
    loadMessages,
    replyToMessage,
    clearReplyToMessage
  } = useChat();
  
  const { 
    getTypingUsers,
    isUserOnline 
  } = useSocket();

  const activeConversation = conversations.find(c => c._id === activeConversationId);
  const typingUsers = getTypingUsers(activeConversationId);

  // FIXED: Smart auto-scroll only for new messages
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

  // Check if user is near bottom and handle pagination
  const handleScroll = async (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setShouldAutoScroll(isNearBottom);
    
    // Load more messages when scrolled to top
    if (scrollTop === 0 && !isLoadingMore && messages.length >= 50) {
      setIsLoadingMore(true);
      const currentPage = Math.ceil(messages.length / 50) + 1;
      
      // Store current scroll position
      const scrollHeightBefore = scrollHeight;
      
      await loadMessages(activeConversationId, currentPage);
      
      // Restore scroll position after loading
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
  }, [activeConversationId]);

  const getConversationName = () => {
    if (!activeConversation) return 'Select a conversation';
    
    if (activeConversation.type === 'group') {
      return activeConversation.name || 'Group Chat';
    }
    
    const otherParticipant = activeConversation.participants?.find(
      p => p.user?._id !== user?._id
    );
    return otherParticipant?.user?.name || 'Unknown User';
  };

  const getConversationAvatar = () => {
    if (!activeConversation) return null;
    
    if (activeConversation.type === 'group') {
      return activeConversation.avatar;
    }
    
    const otherParticipant = activeConversation.participants?.find(
      p => p.user?._id !== user?._id
    );
    return otherParticipant?.user?.avatar;
  };

  const getParticipantStatus = () => {
    if (!activeConversation || activeConversation.type === 'group') {
      return `${activeConversation?.participants?.length || 0} members`;
    }
    
    const otherParticipant = activeConversation.participants?.find(
      p => p.user?._id !== user?._id
    );
    
    if (!otherParticipant) return 'Unknown';
    
    const isOnline = isUserOnline(otherParticipant.user._id);
    return isOnline ? 'Online' : 'Offline';
  };

  if (!activeConversationId) {
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
      {/* Chat Header - Fixed Height */}
      <div className="flex-shrink-0 border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {activeConversation.type === 'group' ? (
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <Hash className="w-5 h-5 text-white" />
                </div>
              ) : (
                <>
                  {getConversationAvatar() ? (
                    <img 
                      src={getConversationAvatar()} 
                      alt={getConversationName()} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {getInitials(getConversationName())}
                      </span>
                    </div>
                  )}
                  {activeConversation.type === 'direct' && getParticipantStatus() === 'Online' && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold text-white truncate">
                {getConversationName()}
              </h1>
              <p className="text-sm text-gray-400 truncate">
                {getParticipantStatus()}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button variant="ghost" size="sm" className="p-2 hover:bg-white/10 transition-colors">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 hover:bg-white/10 transition-colors">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 hover:bg-white/10 transition-colors">
              <Info className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 hover:bg-white/10 transition-colors">
              <MoreVertical className="w-4 h-4" />
            </Button>
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
                ×
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages - FIXED: Proper ordering and scroll behavior */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
          data-message-list
        >
          {isLoadingMore && (
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          )}

          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((message, index) => {
                const prevMessage = messages[index - 1];
                const isGrouped = prevMessage && 
                  prevMessage.sender?._id === message.sender?._id &&
                  (new Date(message.createdAt) - new Date(prevMessage.createdAt)) < 300000; // 5 minutes

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
              conversationId={activeConversationId}
            />

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Message Input - Fixed Height */}
      <div className="flex-shrink-0">
        <MessageInput conversationId={activeConversationId} />
      </div>
    </div>
  );
};

export default ChatWindow;
