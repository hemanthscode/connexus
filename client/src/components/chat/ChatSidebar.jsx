import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Search, 
  Plus, 
  Users, 
  Settings, 
  LogOut,
  Hash,
  Circle,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import { formatDistanceToNow } from 'date-fns';
import { getInitials } from '../../utils/formatters';
import Button from '../ui/Button';
import Input from '../ui/Input';

const ChatSidebar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const searchTimeoutRef = useRef(null);
  const sidebarRef = useRef(null);
  
  const { user, logout } = useAuth();
  const { 
    conversations, 
    activeConversationId, 
    setActiveConversation,
    searchUsers,
    searchResults,
    createDirectConversation 
  } = useChat();
  
  const { 
    onlineUsers, 
    isUserOnline, 
    getTypingUsers 
  } = useSocket();

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchUsers(searchQuery);
        setShowUserSearch(true);
      } else {
        setShowUserSearch(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchUsers]);

  const handleUserSelect = async (selectedUser) => {
    try {
      await createDirectConversation(selectedUser._id);
      setSearchQuery('');
      setShowUserSearch(false);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const getConversationName = (conversation) => {
    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }
    
    const otherParticipant = conversation.participants?.find(
      p => p.user?._id !== user?._id
    );
    return otherParticipant?.user?.name || 'Unknown User';
  };

  const getConversationAvatar = (conversation) => {
    if (conversation.type === 'group') {
      return conversation.avatar || null;
    }
    
    const otherParticipant = conversation.participants?.find(
      p => p.user?._id !== user?._id
    );
    return otherParticipant?.user?.avatar || null;
  };

  const getLastMessagePreview = (conversation) => {
    if (!conversation.lastMessage?.content) return 'No messages yet';
    
    const content = conversation.lastMessage.content;
    const isOwn = conversation.lastMessage.sender?._id === user?._id;
    
    return isOwn ? `You: ${content}` : content;
  };

  const getUnreadCount = (conversation) => {
    return conversation.unreadCount || 0;
  };

  return (
    <div className="w-80 h-full bg-white/5 backdrop-blur-sm border-r border-white/10 flex flex-col overflow-hidden">
      {/* Header - Fixed Height */}
      <div className="flex-shrink-0 p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">Connexus</h1>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="p-2 hover:bg-white/10 transition-colors">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="p-2 hover:bg-white/10 transition-colors">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* User Profile */}
        <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-xl">
          <div className="relative flex-shrink-0">
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {getInitials(user?.name || 'U')}
                </span>
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{user?.name}</p>
            <p className="text-gray-400 text-sm truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Search - Fixed Height */}
      <div className="flex-shrink-0 p-4 relative">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search users or conversations..."
            icon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowUserSearch(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {showUserSearch && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-4 right-4 top-full mt-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto"
            >
              <div className="p-2">
                <p className="text-xs text-gray-400 px-2 py-1 mb-1">Users</p>
                {searchResults.slice(0, 5).map((user) => (
                  <button
                    key={user._id}
                    onClick={() => handleUserSelect(user)}
                    className="w-full flex items-center space-x-3 p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <div className="relative flex-shrink-0">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">
                            {getInitials(user.name)}
                          </span>
                        </div>
                      )}
                      {isUserOnline(user._id) && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-white text-sm font-medium truncate">{user.name}</p>
                      <p className="text-gray-400 text-xs truncate">{user.email}</p>
                    </div>
                    <Circle className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Conversations List - Flexible Height with Scroll */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex-shrink-0 px-4 pb-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-300">Messages</h2>
              <Button variant="ghost" size="sm" className="p-1 hover:bg-white/10 transition-colors">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            <div className="space-y-1">
              <AnimatePresence>
                {conversations.map((conversation) => {
                  const isActive = activeConversationId === conversation._id;
                  const unreadCount = getUnreadCount(conversation);
                  const typingUsers = getTypingUsers(conversation._id);
                  const otherParticipant = conversation.participants?.find(
                    p => p.user?._id !== user?._id
                  );
                  const isOtherUserOnline = otherParticipant && isUserOnline(otherParticipant.user._id);

                  return (
                    <motion.button
                      key={conversation._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => setActiveConversation(conversation._id)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-blue-600/30 border border-blue-500/30' 
                          : 'hover:bg-white/5'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {conversation.type === 'group' ? (
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                            <Hash className="w-6 h-6 text-white" />
                          </div>
                        ) : (
                          <>
                            {getConversationAvatar(conversation) ? (
                              <img 
                                src={getConversationAvatar(conversation)} 
                                alt={getConversationName(conversation)} 
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {getInitials(getConversationName(conversation))}
                                </span>
                              </div>
                            )}
                            {conversation.type === 'direct' && isOtherUserOnline && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-white truncate pr-2">
                            {getConversationName(conversation)}
                          </h3>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {conversation.lastMessage?.timestamp && (
                              <span className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(conversation.lastMessage.timestamp), { addSuffix: false })}
                              </span>
                            )}
                            {unreadCount > 0 && (
                              <div className="bg-blue-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <p className={`text-sm truncate ${
                          typingUsers.length > 0 
                            ? 'text-blue-400' 
                            : unreadCount > 0 
                              ? 'text-gray-300' 
                              : 'text-gray-400'
                        }`}>
                          {typingUsers.length > 0 
                            ? `${typingUsers[0].name} is typing...`
                            : getLastMessagePreview(conversation)
                          }
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>

              {conversations.length === 0 && !showUserSearch && (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm mb-2">No conversations yet</p>
                  <p className="text-gray-500 text-xs">Search for users to start chatting</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Online Users - Fixed Height */}
      <div className="flex-shrink-0 border-t border-white/10 p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">
          Online ({onlineUsers.length})
        </h3>
        <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {onlineUsers.slice(0, 12).map((onlineUser) => (
            <div
              key={onlineUser.userId}
              className="relative group cursor-pointer"
              title={`${onlineUser.name || 'User'} - Online`}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">
                  {getInitials(onlineUser.name || 'U')}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border border-white rounded-full"></div>
            </div>
          ))}
          {onlineUsers.length > 12 && (
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">+{onlineUsers.length - 12}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
