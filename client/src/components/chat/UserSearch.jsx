/**
 * User Search Component - CLEAN & OPTIMIZED
 * Standalone search component for users and conversations
 */

import { useState, useEffect, useRef, memo, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, UserPlus, MessageCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import { filterNewUsers } from '../../utils/chatHelpers';
import Input from '../ui/Input';
import Avatar from '../ui/Avatar';
import Loading from '../ui/Loading';
import ConversationItem from './ConversationItem';

// MEMOIZED New User Item
const NewUserItem = memo(forwardRef(({ user, onSelect }, ref) => {
  const { isUserOnline } = useSocket();

  return (
    <motion.button
      ref={ref}
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      onClick={() => onSelect(user)}
      className="w-full p-3 rounded-xl bg-green-500/5 border border-green-500/20 hover:bg-green-500/10 transition-all group"
    >
      <div className="flex items-center space-x-3">
        <Avatar
          src={user.avatar}
          name={user.name}
          size="lg"
          isOnline={isUserOnline(user._id)}
          showOnlineStatus
        />
        
        <div className="flex-1 min-w-0 text-left">
          <h4 className="font-medium text-sm text-white group-hover:text-green-200 truncate">
            {user.name}
          </h4>
          <p className="text-xs text-gray-400 group-hover:text-green-300 truncate">
            {user.email}
          </p>
        </div>

        <UserPlus className="w-4 h-4 text-green-400 opacity-60 group-hover:opacity-100" />
      </div>
    </motion.button>
  );
}));
NewUserItem.displayName = 'NewUserItem';

const UserSearch = ({ 
  conversations = [],
  activeConversationId,
  onConversationClick,
  onUserSelect,
  getUnreadCount,
  getTypingText,
  className = "" 
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState({ conversations: [], newUsers: [] });
  const timeoutRef = useRef(null);
  
  const { user } = useAuth();
  const { searchUsers, searchResults: apiResults, setTemporaryConversation } = useChat();

  // Search function
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const trimmed = query.trim();
    
    if (trimmed.length < 2) {
      setIsLoading(false);
      setResults({ conversations: [], newUsers: [] });
      return;
    }

    setIsLoading(true);

    timeoutRef.current = setTimeout(async () => {
      try {
        await searchUsers(query);
        
        // Filter conversations
        const matchingConversations = conversations.filter(conv => {
          const name = conv.type === 'group' 
            ? (conv.name || 'Group Chat')
            : conv.participants?.find(p => p.user?._id !== user?._id)?.user?.name || 'Unknown';
          const content = conv.lastMessage?.content || '';
          const q = trimmed.toLowerCase();
          return name.toLowerCase().includes(q) || content.toLowerCase().includes(q);
        });

        const newUsers = filterNewUsers(apiResults, conversations, user?._id);
        
        setResults({ conversations: matchingConversations, newUsers });
      } catch (error) {
        console.error('Search failed:', error);
        setResults({ conversations: [], newUsers: [] });
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutRef.current);
  }, [query, searchUsers, conversations, apiResults, user?._id]);

  const handleUserSelect = (selectedUser) => {
    setTemporaryConversation(selectedUser);
    setQuery('');
    onUserSelect?.(selectedUser);
  };

  const handleConversationClick = (conversationId) => {
    setQuery('');
    onConversationClick?.(conversationId);
  };

  const totalResults = results.conversations.length + results.newUsers.length;
  const showResults = query.length >= 2;

  return (
    <div className={className}>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search conversations and users..."
        icon={<Search className="w-4 h-4" />}
        rightIcon={query && (
          <button onClick={() => setQuery('')} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
        variant={showResults && totalResults > 0 ? 'success' : 'default'}
      />

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
          >
            {isLoading ? (
              <div className="flex flex-col items-center py-8">
                <Loading size="md" />
                <p className="text-gray-400 mt-3 text-sm">Searching...</p>
              </div>
            ) : totalResults > 0 ? (
              <>
                {/* Conversations */}
                {results.conversations.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <MessageCircle className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-semibold text-blue-300">
                        Conversations ({results.conversations.length})
                      </span>
                      <div className="flex-1 h-px bg-blue-500/20" />
                    </div>
                    <div className="space-y-2">
                      <AnimatePresence>
                        {results.conversations.map((conversation) => (
                          <ConversationItem
                            key={conversation._id}
                            conversation={conversation}
                            isActive={activeConversationId === conversation._id}
                            unreadCount={getUnreadCount?.(conversation._id) || 0}
                            typingText={getTypingText?.(conversation._id, user?._id)}
                            onClick={handleConversationClick}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* New Users */}
                {results.newUsers.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <UserPlus className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-semibold text-green-300">
                        New Users ({results.newUsers.length})
                      </span>
                      <div className="flex-1 h-px bg-green-500/20" />
                    </div>
                    <div className="space-y-2">
                      <AnimatePresence>
                        {results.newUsers.map((user) => (
                          <NewUserItem
                            key={user._id}
                            user={user}
                            onSelect={handleUserSelect}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-gray-300 font-medium mb-2">No results for "{query}"</h3>
                <p className="text-gray-500 text-sm">Try different keywords or check spelling</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserSearch;
