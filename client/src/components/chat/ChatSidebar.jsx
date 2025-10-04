/**
 * Chat Sidebar - CLEAN & MODULAR with Group Support
 * Updated with GroupModal integration
 */

import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, Settings, LogOut, User, MoreVertical, Search, X, UserPlus, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import { filterNewUsers } from '../../utils/chatHelpers';
import { ROUTES } from '../../utils/constants';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import Loading from '../ui/Loading';
import ConversationItem from './ConversationItem';
import GroupModal from '../groups/GroupModal'; // Group components import

// CLEAN Search Results Component
const SearchResults = memo(({ 
  query, isLoading, conversations, newUsers, activeId, onConversationClick, onUserSelect, getUnreadCount, getTypingText, userId 
}) => {
  const totalResults = conversations.length + newUsers.length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-6">
        <Loading size="sm" />
        <p className="text-gray-400 mt-2 text-xs">Searching...</p>
      </div>
    );
  }

  if (totalResults === 0) {
    return (
      <div className="text-center py-6">
        <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-300 text-sm font-medium">No results</p>
        <p className="text-gray-500 text-xs">Try different keywords</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Conversations */}
      {conversations.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <MessageCircle className="w-3 h-3 text-blue-400" />
            <span className="text-xs font-medium text-blue-300">Conversations ({conversations.length})</span>
          </div>
          <div className="space-y-1">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv._id}
                conversation={conv}
                isActive={activeId === conv._id}
                unreadCount={getUnreadCount(conv._id)}
                typingText={getTypingText(conv._id, userId)}
                onClick={onConversationClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* New Users */}
      {newUsers.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <UserPlus className="w-3 h-3 text-green-400" />
            <span className="text-xs font-medium text-green-300">New Users ({newUsers.length})</span>
          </div>
          <div className="space-y-1">
            {newUsers.map((user) => (
              <motion.button
                key={user._id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onUserSelect(user)}
                className="w-full p-3 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/15 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <Avatar src={user.avatar} name={user.name} size="lg" />
                  <div className="flex-1 min-w-0 text-left">
                    <h4 className="font-medium text-sm text-white truncate">{user.name}</h4>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  <UserPlus className="w-4 h-4 text-green-400 flex-shrink-0" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
SearchResults.displayName = 'SearchResults';

const ChatSidebar = () => {
  const [filter, setFilter] = useState('all');
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState({ conversations: [], newUsers: [] });
  
  // GROUP MODAL STATE
  const [showGroupModal, setShowGroupModal] = useState(false);
  
  const menuRef = useRef(null);
  const timeoutRef = useRef(null);
  
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { 
    conversations, activeConversationId, setActiveConversation,
    getUnreadCount, markConversationAsRead, searchUsers, searchResults: apiResults, setTemporaryConversation
  } = useChat();
  const { getTypingIndicatorText } = useSocket();

  // Search Logic
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const trimmed = searchQuery.trim();
    
    if (trimmed.length < 2) {
      setIsSearching(false);
      setSearchResults({ conversations: [], newUsers: [] });
      return;
    }

    setIsSearching(true);

    timeoutRef.current = setTimeout(async () => {
      try {
        await searchUsers(searchQuery);
        
        const matchingConversations = conversations.filter(conv => {
          const name = conv.type === 'group' 
            ? (conv.name || 'Group Chat')
            : conv.participants?.find(p => p.user?._id !== user?._id)?.user?.name || 'Unknown';
          return name.toLowerCase().includes(trimmed.toLowerCase());
        });

        const newUsers = filterNewUsers(apiResults, conversations, user?._id);
        
        setSearchResults({ conversations: matchingConversations, newUsers });
      } catch (error) {
        setSearchResults({ conversations: [], newUsers: [] });
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutRef.current);
  }, [searchQuery, searchUsers, conversations, apiResults, user?._id]);

  // Menu close handler
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleConversationClick = (id) => {
    setActiveConversation(id);
    markConversationAsRead(id);
  };

  const handleUserSelect = (selectedUser) => {
    setTemporaryConversation(selectedUser);
    setSearchQuery('');
  };

  // GROUP MODAL HANDLERS
  const handleGroupCreated = (newGroup) => {
    setActiveConversation(newGroup._id);
    setShowGroupModal(false);
  };

  // Filter conversations
  const displayConversations = conversations.filter(conv => {
    if (filter === 'unread') return getUnreadCount(conv._id) > 0;
    if (filter === 'groups') return conv.type === 'group';
    return true;
  });

  const totalUnread = conversations.reduce((sum, conv) => sum + getUnreadCount(conv._id), 0);
  const showSearchResults = searchQuery.length >= 2;

  return (
    <div className="w-80 h-full bg-white/5 backdrop-blur-sm border-r border-white/10 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Connexus
            </h1>
            {totalUnread > 0 && (
              <div className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-2">
                {totalUnread > 99 ? '99+' : totalUnread}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* NEW GROUP BUTTON */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowGroupModal(true)}
              className="p-2"
              title="Create New Group"
            >
              <Users className="w-4 h-4" />
            </Button>
            
            <div className="relative" ref={menuRef}>
              <Button variant="ghost" size="sm" onClick={() => setShowMenu(!showMenu)} className="p-2">
                <MoreVertical className="w-4 h-4" />
              </Button>
              
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute right-0 top-full mt-2 w-44 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    {[
                      { key: 'profile', label: 'Profile', icon: User, action: () => navigate(ROUTES.PROFILE) },
                      { key: 'newGroup', label: 'New Group', icon: Users, action: () => setShowGroupModal(true) },
                      { key: 'settings', label: 'Settings', icon: Settings, action: () => navigate(ROUTES.SETTINGS) },
                      { key: 'logout', label: 'Logout', icon: LogOut, action: logout, danger: true }
                    ].map(({ key, label, icon: Icon, action, danger }) => (
                      <button
                        key={key}
                        onClick={() => { setShowMenu(false); action(); }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-sm transition-colors text-left ${
                          danger ? 'hover:bg-red-500/20 text-red-300' : 'hover:bg-white/10 text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex-shrink-0 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations and users..."
            className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      {!showSearchResults && (
        <div className="flex-shrink-0 px-4 pb-2">
          <div className="flex bg-white/5 rounded-lg p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread', count: totalUnread },
              { key: 'groups', label: 'Groups' }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-all flex items-center justify-center space-x-2 ${
                  filter === key ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>{label}</span>
                {count > 0 && key === 'unread' && (
                  <div className="bg-red-500 text-white text-xs rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                    {count > 9 ? '9+' : count}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 min-h-0 px-4">
        {showSearchResults ? (
          <SearchResults
            query={searchQuery}
            isLoading={isSearching}
            conversations={searchResults.conversations}
            newUsers={searchResults.newUsers}
            activeId={activeConversationId}
            onConversationClick={handleConversationClick}
            onUserSelect={handleUserSelect}
            getUnreadCount={getUnreadCount}
            getTypingText={getTypingIndicatorText}
            userId={user?._id}
          />
        ) : (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-300">Messages</h2>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">({displayConversations.length})</span>
                {filter === 'groups' && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setShowGroupModal(true)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    + New
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
              <AnimatePresence>
                {displayConversations.map((conversation) => (
                  <ConversationItem 
                    key={conversation._id}
                    conversation={conversation}
                    isActive={activeConversationId === conversation._id}
                    unreadCount={getUnreadCount(conversation._id)}
                    typingText={getTypingIndicatorText(conversation._id, user?._id)}
                    onClick={handleConversationClick}
                  />
                ))}
              </AnimatePresence>

              {displayConversations.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    {filter === 'groups' ? (
                      <Users className="w-8 h-8 text-gray-400" />
                    ) : (
                      <MessageCircle className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <h3 className="text-gray-300 font-medium mb-2">
                    {filter === 'groups' ? 'No groups yet' : 'No conversations'}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    {filter === 'groups' 
                      ? 'Create a group to start collaborating'
                      : 'Search for users to start chatting'
                    }
                  </p>
                  {filter === 'groups' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowGroupModal(true)}
                      leftIcon={<Users className="w-4 h-4" />}
                    >
                      Create Group
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* GROUP MODAL */}
      <GroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onGroupCreated={handleGroupCreated}
        group={null} // Always null for new group creation in sidebar
      />
    </div>
  );
};

export default ChatSidebar;
