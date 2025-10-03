import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Search, 
  Users, 
  Settings, 
  LogOut,
  Hash,
  X,
  User,
  Dot,
  MoreVertical,
  UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import { formatDistanceToNow } from 'date-fns';
import { getInitials } from '../../utils/formatters';
import Button from '../ui/Button';
import Input from '../ui/Input';

const ChatSidebar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [conversationFilter, setConversationFilter] = useState('all');
  const [showMenu, setShowMenu] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [filteredExistingConversations, setFilteredExistingConversations] = useState([]);
  const [newUserResults, setNewUserResults] = useState([]);
  
  const searchTimeoutRef = useRef(null);
  const menuRef = useRef(null);
  
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { 
    conversations, 
    activeConversationId, 
    setActiveConversation,
    searchUsers,
    searchResults,
    setTemporaryConversation, // FIXED: Use setTemporaryConversation instead of createDirectConversation
    getUnreadCount,
    markConversationAsRead,
  } = useChat();
  
  const { 
    isUserOnline, 
    getTypingUsers 
  } = useSocket();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Enhanced intelligent search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Immediate filtering of existing conversations
    if (searchQuery.trim()) {
      const filtered = conversations.filter(conversation => {
        const conversationName = getConversationName(conversation).toLowerCase();
        const searchLower = searchQuery.toLowerCase();
        
        // Check conversation name
        if (conversationName.includes(searchLower)) return true;
        
        // Check last message content
        if (conversation.lastMessage?.content?.toLowerCase().includes(searchLower)) return true;
        
        // For direct chats, also check email
        if (conversation.type === 'direct') {
          const otherParticipant = conversation.participants?.find(
            p => p.user?._id !== user?._id
          );
          if (otherParticipant?.user?.email?.toLowerCase().includes(searchLower)) return true;
        }
        
        return false;
      });
      setFilteredExistingConversations(filtered);
      setIsSearching(true);
    } else {
      setFilteredExistingConversations([]);
      setNewUserResults([]);
      setIsSearching(false);
    }

    // Backend search for new users (only if 2+ characters)
    searchTimeoutRef.current = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        try {
          await searchUsers(searchQuery);
          
          // Filter out users we already have conversations with
          const existingUserIds = conversations
            .filter(conv => conv.type === 'direct')
            .map(conv => {
              const otherParticipant = conv.participants?.find(
                p => p.user?._id !== user?._id
              );
              return otherParticipant?.user?._id;
            })
            .filter(Boolean);

          const newUsers = searchResults.filter(
            searchUser => !existingUserIds.includes(searchUser._id) && searchUser._id !== user?._id
          );
          
          setNewUserResults(newUsers);
        } catch (error) {
          console.error('Search failed:', error);
          setNewUserResults([]);
        }
      } else {
        setNewUserResults([]);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, conversations, searchUsers, searchResults, user]);

  const handleConversationClick = (conversationId) => {
    setActiveConversation(conversationId);
    setTimeout(() => {
      markConversationAsRead(conversationId);
    }, 300);
  };

  // FIXED: Updated to use temporary conversation system
  const handleNewUserClick = (selectedUser) => {
    try {
      console.log('👤 Creating temporary conversation with:', selectedUser.name);
      setTemporaryConversation(selectedUser); // Create temporary conversation
      setSearchQuery(''); // Clear search
      setIsSearching(false); // Exit search mode
      console.log('✅ Temporary conversation created, ready to chat!');
    } catch (error) {
      console.error('Failed to create temporary conversation:', error);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilteredExistingConversations([]);
    setNewUserResults([]);
    setIsSearching(false);
  };

  const handleMenuAction = (action) => {
    setShowMenu(false);
    switch (action) {
      case 'profile':
        navigate('/profile');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'logout':
        logout().then(() => navigate('/login'));
        break;
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

  // Determine what conversations to show
  const getDisplayConversations = () => {
    if (isSearching) {
      // Show filtered existing conversations first, then new users
      return {
        existingConversations: filteredExistingConversations,
        newUsers: newUserResults,
        showingSections: true
      };
    }

    // Regular filtering for non-search
    const filtered = conversations.filter(conversation => {
      if (conversationFilter === 'unread') {
        return getUnreadCount(conversation._id) > 0;
      } else if (conversationFilter === 'groups') {
        return conversation.type === 'group';
      }
      return true;
    });

    return {
      existingConversations: filtered,
      newUsers: [],
      showingSections: false
    };
  };

  const { existingConversations, newUsers, showingSections } = getDisplayConversations();
  const totalUnreadCount = conversations.reduce((total, conv) => {
    return total + getUnreadCount(conv._id);
  }, 0);

  return (
    <div className="w-80 h-full bg-white/5 backdrop-blur-sm border-r border-white/10 flex flex-col overflow-hidden">
      {/* Header - Clean with Menu */}
      <div className="flex-shrink-0 p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Connexus
            </h1>
            {totalUnreadCount > 0 && (
              <motion.div 
                key={totalUnreadCount}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-2 shadow-lg"
              >
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </motion.div>
            )}
          </div>
          
          {/* Menu Button */}
          <div className="relative" ref={menuRef}>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-white/10 text-gray-300 hover:text-white transition-all duration-200"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
            
            {/* Dropdown Menu */}
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="py-2">
                    <button
                      onClick={() => handleMenuAction('profile')}
                      className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
                    >
                      <User className="w-4 h-4 text-blue-400" />
                      <span className="text-white font-medium">My Profile</span>
                    </button>
                    <button
                      onClick={() => handleMenuAction('settings')}
                      className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
                    >
                      <Settings className="w-4 h-4 text-purple-400" />
                      <span className="text-white font-medium">Settings</span>
                    </button>
                    <div className="border-t border-white/10 my-1"></div>
                    <button
                      onClick={() => handleMenuAction('logout')}
                      className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-500/20 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span className="text-red-300 font-medium">Logout</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Enhanced Search Section */}
      <div className="flex-shrink-0 p-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search conversations and users..."
            icon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pr-10 transition-all duration-200 ${
              isSearching 
                ? 'bg-blue-500/10 border-blue-400/50 focus:border-blue-400 focus:ring-blue-400/30' 
                : 'bg-white/10 border-white/20 focus:border-blue-400 focus:ring-blue-400/30'
            }`}
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 text-xs text-blue-300 px-2"
          >
            {searchQuery.length < 2 
              ? 'Type 2+ characters to search for new users'
              : `Found ${existingConversations.length} conversations${newUsers.length > 0 ? ` • ${newUsers.length} new users` : ''}`
            }
          </motion.div>
        )}
      </div>

      {/* Filter Tabs - Hide during search */}
      {!isSearching && (
        <div className="flex-shrink-0 px-4 pb-2">
          <div className="flex space-x-1 bg-white/5 rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setConversationFilter('all')}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-all duration-200 font-medium ${
                conversationFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setConversationFilter('unread')}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-all duration-200 flex items-center justify-center space-x-2 font-medium ${
                conversationFilter === 'unread'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>Unread</span>
              {totalUnreadCount > 0 && (
                <motion.div 
                  key={totalUnreadCount}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="bg-red-500 text-white text-xs rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1"
                >
                  {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                </motion.div>
              )}
            </button>
            <button
              onClick={() => setConversationFilter('groups')}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-all duration-200 font-medium ${
                conversationFilter === 'groups'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Groups
            </button>
          </div>
        </div>
      )}

      {/* Messages Header */}
      <div className="flex-shrink-0 px-4 pb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300">
            {isSearching ? 'Search Results' : 'Messages'} 
            <span className="text-gray-400 ml-1">
              ({existingConversations.length}{newUsers.length > 0 ? `+${newUsers.length}` : ''})
            </span>
          </h2>
        </div>
      </div>

      {/* Enhanced Conversations List */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-y-auto px-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          <div className="space-y-2 pb-4">
            {/* Existing Conversations Section */}
            {showingSections && existingConversations.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-3 px-2">
                  <MessageCircle className="w-3 h-3 text-blue-400" />
                  <span className="text-xs font-semibold text-blue-300 uppercase tracking-wide">
                    Your Conversations ({existingConversations.length})
                  </span>
                  <div className="flex-1 h-px bg-blue-500/20"></div>
                </div>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {existingConversations.map((conversation) => {
                const isActive = activeConversationId === conversation._id;
                const unreadCount = getUnreadCount(conversation._id);
                const typingUsers = getTypingUsers(conversation._id);
                const otherParticipant = conversation.participants?.find(
                  p => p.user?._id !== user?._id
                );
                const isOtherUserOnline = otherParticipant && isUserOnline(otherParticipant.user._id);

                return (
                  <motion.button
                    key={conversation._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleConversationClick(conversation._id)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 group ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/20 border border-blue-500/30 shadow-lg' 
                        : unreadCount > 0
                          ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/5 hover:from-blue-500/20 hover:to-purple-500/10 border border-blue-500/20'
                          : 'hover:bg-white/5 border border-transparent hover:border-white/10'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {conversation.type === 'group' ? (
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                          <Hash className="w-6 h-6 text-white" />
                        </div>
                      ) : (
                        <>
                          {getConversationAvatar(conversation) ? (
                            <img 
                              src={getConversationAvatar(conversation)} 
                              alt={getConversationName(conversation)} 
                              className="w-12 h-12 rounded-xl object-cover shadow-md"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center shadow-md">
                              <span className="text-white font-semibold text-sm">
                                {getInitials(getConversationName(conversation))}
                              </span>
                            </div>
                          )}
                          {conversation.type === 'direct' && isOtherUserOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                          )}
                        </>
                      )}
                      
                      {unreadCount > 0 && !isActive && (
                        <motion.div 
                          key={unreadCount}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center shadow-md"
                        >
                          <Dot className="w-3 h-3 text-white animate-pulse" />
                        </motion.div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-semibold truncate pr-2 transition-colors ${
                          unreadCount > 0 && !isActive ? 'text-white' : isActive ? 'text-blue-100' : 'text-gray-300 group-hover:text-white'
                        }`}>
                          {getConversationName(conversation)}
                        </h3>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {conversation.lastMessage?.timestamp && (
                            <span className={`text-xs transition-colors ${
                              unreadCount > 0 && !isActive ? 'text-gray-300' : 'text-gray-400'
                            }`}>
                              {formatDistanceToNow(new Date(conversation.lastMessage.timestamp), { addSuffix: false })}
                            </span>
                          )}
                          {unreadCount > 0 && (
                            <motion.div
                              key={unreadCount}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-2 shadow-lg"
                            >
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </motion.div>
                          )}
                        </div>
                      </div>
                      
                      <p className={`text-sm truncate transition-colors ${
                        typingUsers.length > 0 
                          ? 'text-blue-400 italic font-medium' 
                          : unreadCount > 0 && !isActive
                            ? 'text-gray-200' 
                            : isActive ? 'text-blue-200/70' : 'text-gray-400 group-hover:text-gray-300'
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

            {/* New Users Section */}
            {showingSections && newUsers.length > 0 && (
              <>
                <div className="mt-6 mb-4">
                  <div className="flex items-center space-x-2 mb-3 px-2">
                    <UserPlus className="w-3 h-3 text-green-400" />
                    <span className="text-xs font-semibold text-green-300 uppercase tracking-wide">
                      New Users ({newUsers.length})
                    </span>
                    <div className="flex-1 h-px bg-green-500/20"></div>
                  </div>
                </div>

                <AnimatePresence mode="popLayout">
                  {newUsers.map((newUser) => (
                    <motion.button
                      key={`new-${newUser._id}`}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => handleNewUserClick(newUser)} // FIXED: Updated function call
                      className="w-full flex items-center space-x-3 p-3 rounded-xl border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 transition-all duration-200 group"
                    >
                      <div className="relative flex-shrink-0">
                        {newUser.avatar ? (
                          <img 
                            src={newUser.avatar} 
                            alt={newUser.name} 
                            className="w-12 h-12 rounded-xl object-cover shadow-md"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                            <span className="text-white font-semibold text-sm">
                              {getInitials(newUser.name)}
                            </span>
                          </div>
                        )}
                        {isUserOnline(newUser._id) && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                        )}
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                          <UserPlus className="w-2 h-2 text-white" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <h3 className="font-semibold truncate pr-2 text-white group-hover:text-green-200 transition-colors">
                          {newUser.name}
                        </h3>
                        <p className="text-sm truncate text-gray-300 group-hover:text-green-300 transition-colors">
                          {newUser.email}
                        </p>
                      </div>

                      <div className="text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <UserPlus className="w-4 h-4" />
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </>
            )}

            {/* Empty States */}
            {existingConversations.length === 0 && newUsers.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  {isSearching ? (
                    <Search className="w-8 h-8 text-gray-400" />
                  ) : (
                    <MessageCircle className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <h3 className="text-gray-300 font-medium mb-2">
                  {isSearching 
                    ? `No results for "${searchQuery}"`
                    : conversationFilter === 'unread' 
                      ? 'No unread messages'
                      : conversationFilter === 'groups'
                        ? 'No group chats yet'
                        : 'No conversations yet'
                  }
                </h3>
                <p className="text-gray-500 text-sm">
                  {isSearching 
                    ? 'Try a different search term'
                    : conversationFilter === 'all' 
                      ? 'Search for users to start chatting' 
                      : 'Try switching to "All" to see your conversations'
                  }
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
