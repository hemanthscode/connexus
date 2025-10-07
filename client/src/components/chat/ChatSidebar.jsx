/**
 * Chat Sidebar - REDESIGNED & STREAMLINED
 * Modern design patterns, no redundant features, optimal UX
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, Plus, Settings, LogOut, User, 
  Users, MessageCircle, UserPlus, Hash 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import { conversationHelpers, userHelpers } from '../../utils/chatHelpers';
import { ROUTES } from '../../utils/constants';
import { sanitizers } from '../../utils/validation';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Avatar from '../ui/Avatar';
import Loading from '../ui/Loading';
import ConversationItem from './ConversationItem';
import GroupModal from '../groups/GroupModal';

const ChatSidebar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState({ conversations: [], newUsers: [] });
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const searchTimeout = useRef(null);
  const userMenuRef = useRef(null);
  
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { 
    conversations, activeConversationId, setActiveConversation, getUnreadCount, 
    markConversationAsRead, searchUsers, searchResults: apiResults, setTemporaryConversation
  } = useChat();

  // SMART SORTING: Unread conversations first, then by recent activity
  const smartSortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const aUnread = getUnreadCount(a._id);
      const bUnread = getUnreadCount(b._id);
      
      // Unread conversations come first
      if (aUnread > 0 && bUnread === 0) return -1;
      if (bUnread > 0 && aUnread === 0) return 1;
      
      // Within same unread status, sort by recent activity
      const aTime = a.lastMessage?.timestamp || a.updatedAt || a.createdAt || 0;
      const bTime = b.lastMessage?.timestamp || b.updatedAt || b.createdAt || 0;
      return new Date(bTime) - new Date(aTime);
    });
  }, [conversations, getUnreadCount, activeConversationId]);

  // TOTAL UNREAD for header badge
  const totalUnread = useMemo(() => {
    return smartSortedConversations.reduce((sum, conv) => sum + (getUnreadCount(conv._id) || 0), 0);
  }, [smartSortedConversations, getUnreadCount, activeConversationId]);

  // ENHANCED SEARCH with debounce
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    const sanitizedQuery = sanitizers.searchQuery(searchQuery);
    if (sanitizedQuery.length < 2) {
      setIsSearching(false);
      setSearchResults({ conversations: [], newUsers: [] });
      return;
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        await searchUsers(sanitizedQuery);
        setSearchResults({
          conversations: conversationHelpers.searchConversations(smartSortedConversations, sanitizedQuery, user?._id),
          newUsers: userHelpers.filterNewUsers(apiResults, conversations, user?._id)
        });
      } catch (error) {
        setSearchResults({ conversations: [], newUsers: [] });
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery, searchUsers, smartSortedConversations, apiResults, user?._id]);

  // Close user menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleConversationClick = async (id) => {
    setActiveConversation(id);
    try {
      await markConversationAsRead(id);
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
    }
  };

  const handleNewChat = () => {
    setSearchQuery('');
    // Focus search to find users
    document.querySelector('input[placeholder*="Search"]')?.focus();
  };

  const showSearchResults = searchQuery.length >= 2;
  const hasSearchResults = searchResults.conversations.length > 0 || searchResults.newUsers.length > 0;

  // USER MENU ACTIONS - Streamlined
  const userMenuActions = [
    { key: 'profile', label: 'Profile', icon: User, action: () => navigate(ROUTES.PROFILE) },
    { key: 'settings', label: 'Settings', icon: Settings, action: () => navigate(ROUTES.SETTINGS) },
    { key: 'logout', label: 'Sign out', icon: LogOut, action: logout, variant: 'danger' }
  ];

  return (
    <div className="w-80 h-full bg-white/5 backdrop-blur-sm border-r border-white/10 flex flex-col">
      
      {/* STREAMLINED HEADER */}
      <div className="flex-shrink-0 p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          {/* App Title + Unread Badge */}
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Connexus
            </h1>
            <AnimatePresence>
              {totalUnread > 0 && (
                <motion.div
                  key={totalUnread}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-2"
                >
                  {totalUnread > 99 ? '99+' : totalUnread}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            {/* New Chat */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleNewChat}
              className="p-2" 
              title="New chat"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
            
            {/* New Group */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowGroupModal(true)}
              className="p-2" 
              title="New group"
            >
              <Users className="w-4 h-4" />
            </Button>
            
            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-1"
              >
                <Avatar
                  src={user?.avatar}
                  name={user?.name}
                  size="sm"
                  className="border border-white/20"
                />
              </Button>
              
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-gray-900/95 backdrop-blur border border-white/20 rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                    
                    {/* Menu Actions */}
                    {userMenuActions.map(({ key, label, icon: Icon, action, variant }) => (
                      <Button
                        key={key}
                        variant="ghost"
                        onClick={() => { setShowUserMenu(false); action(); }}
                        className={`w-full justify-start px-4 py-3 text-sm rounded-none ${
                          variant === 'danger' ? 'hover:bg-red-500/20 text-red-300' : 'hover:bg-white/10'
                        }`}
                        leftIcon={<Icon className="w-4 h-4" />}
                      >
                        {label}
                      </Button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ENHANCED SEARCH */}
      <div className="flex-shrink-0 p-4">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search conversations and users..."
          icon={<Search className="w-4 h-4" />}
          rightIcon={searchQuery && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setSearchQuery('')}
              className="p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          className="transition-all focus-within:ring-2 focus-within:ring-blue-500/30"
        />
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-h-0 px-4 pb-4">
        {showSearchResults ? (
          /* SEARCH RESULTS */
          <div className="space-y-4">
            {isSearching ? (
              <Loading size="sm" text="Searching..." className="py-8" />
            ) : !hasSearchResults ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-gray-300 font-medium mb-2">No results found</h3>
                <p className="text-gray-500 text-sm">Try different keywords or check spelling</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Existing Conversations */}
                {searchResults.conversations.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <MessageCircle className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-blue-300">
                        Conversations ({searchResults.conversations.length})
                      </span>
                      <div className="flex-1 h-px bg-blue-500/20" />
                    </div>
                    <div className="space-y-1">
                      <AnimatePresence>
                        {searchResults.conversations.map((conv) => (
                          <ConversationItem
                            key={conv._id}
                            conversation={conv}
                            isActive={activeConversationId === conv._id}
                            unreadCount={getUnreadCount(conv._id)}
                            onClick={handleConversationClick}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* New Users */}
                {searchResults.newUsers.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <UserPlus className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium text-green-300">
                        People ({searchResults.newUsers.length})
                      </span>
                      <div className="flex-1 h-px bg-green-500/20" />
                    </div>
                    <div className="space-y-2">
                      <AnimatePresence>
                        {searchResults.newUsers.map((user) => (
                          <motion.div
                            key={user._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                          >
                            <Button
                              variant="ghost"
                              onClick={() => { 
                                setTemporaryConversation(user); 
                                setSearchQuery(''); 
                              }}
                              className="w-full p-3 rounded-xl bg-green-500/5 border border-green-500/20 hover:bg-green-500/10 justify-start"
                            >
                              <div className="flex items-center space-x-3 w-full">
                                <Avatar src={user.avatar} name={user.name} size="md" />
                                <div className="flex-1 text-left">
                                  <h4 className="font-medium text-sm text-white truncate">{user.name}</h4>
                                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                </div>
                                <MessageCircle className="w-4 h-4 text-green-400" />
                              </div>
                            </Button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* CONVERSATION LIST */
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-300">Chats</h2>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">({smartSortedConversations.length})</span>
                {totalUnread > 0 && (
                  <span className="text-xs text-blue-400 font-medium">
                    {totalUnread} unread
                  </span>
                )}
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
              {smartSortedConversations.length > 0 ? (
                <div className="space-y-1">
                  <AnimatePresence initial={false}>
                    {smartSortedConversations.map((conversation) => (
                      <motion.div
                        key={conversation._id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ConversationItem 
                          conversation={conversation}
                          isActive={activeConversationId === conversation._id}
                          unreadCount={getUnreadCount(conversation._id)}
                          onClick={handleConversationClick}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                /* SMART EMPTY STATE */
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="w-10 h-10 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Welcome to Connexus</h3>
                  <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
                    Start a conversation by searching for people or create a group to collaborate.
                  </p>
                  <div className="flex flex-col space-y-3 max-w-xs mx-auto">
                    <Button 
                      variant="primary" 
                      onClick={handleNewChat}
                      leftIcon={<MessageCircle className="w-4 h-4" />}
                    >
                      Start a chat
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => setShowGroupModal(true)}
                      leftIcon={<Users className="w-4 h-4" />}
                    >
                      Create group
                    </Button>
                  </div>
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
        onGroupCreated={(newGroup) => {
          setActiveConversation(newGroup._id);
          setShowGroupModal(false);
        }}
      />
    </div>
  );
};

export default ChatSidebar;
