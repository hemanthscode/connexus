/**
 * User Search - ULTRA OPTIMIZED
 * Enhanced error handling, maximized component reuse
 */
import { useState, useEffect, useRef, memo, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, UserPlus, MessageCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import { conversationHelpers, userHelpers } from '../../utils/chatHelpers';
import { TIME } from '../../utils/constants';
import { sanitizers } from '../../utils/validation';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import Loading from '../ui/Loading';
import ConversationItem from './ConversationItem';

// OPTIMIZED: NewUserItem using Button as base
const NewUserItem = memo(forwardRef(({ user, onSelect }, ref) => {
  const { isUserOnline } = useSocket();

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
    >
      <Button
        variant="ghost"
        onClick={() => onSelect(user)}
        className="w-full p-3 rounded-xl bg-green-500/5 border border-green-500/20 hover:bg-green-500/10 justify-start"
      >
        <div className="flex items-center space-x-3 w-full">
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
      </Button>
    </motion.div>
  );
}));

NewUserItem.displayName = 'NewUserItem';

// OPTIMIZED: Results sections using consistent patterns
const ResultSection = ({ icon: Icon, title, count, color, children }) => (
  <div>
    <div className="flex items-center space-x-2 mb-3">
      <Icon className={`w-4 h-4 text-${color}-400`} />
      <span className={`text-sm font-semibold text-${color}-300`}>
        {title} ({count})
      </span>
      <div className={`flex-1 h-px bg-${color}-500/20`} />
    </div>
    <div className="space-y-2">
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  </div>
);

const UserSearch = ({ 
  conversations = [],
  activeConversationId,
  onConversationClick,
  onUserSelect,
  getUnreadCount,
  className = "" 
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState({ conversations: [], newUsers: [] });
  const timeoutRef = useRef(null);
  
  const { user } = useAuth();
  const { searchUsers, searchResults: apiResults, setTemporaryConversation } = useChat();

  // ENHANCED: Search with better error handling
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const sanitizedQuery = sanitizers.searchQuery(query);
    
    if (sanitizedQuery.length < 2) {
      setIsLoading(false);
      setError(null);
      setResults({ conversations: [], newUsers: [] });
      return;
    }

    setIsLoading(true);
    setError(null);

    timeoutRef.current = setTimeout(async () => {
      try {
        await searchUsers(sanitizedQuery);
        
        const matchingConversations = conversationHelpers.searchConversations(
          conversations, 
          sanitizedQuery, 
          user?._id
        );

        const newUsers = userHelpers.filterNewUsers(apiResults, conversations, user?._id);
        
        setResults({ conversations: matchingConversations, newUsers });
      } catch (error) {
        console.error('Search failed:', error);
        setError('Search failed. Please try again.');
        setResults({ conversations: [], newUsers: [] });
      } finally {
        setIsLoading(false);
      }
    }, TIME.TYPING_THROTTLE / 3);

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
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setQuery('')}
            className="p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        variant={error ? 'error' : showResults && totalResults > 0 ? 'success' : 'default'}
        error={error}
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
            ) : error ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-red-300 font-medium mb-2">Search Error</h3>
                <p className="text-gray-500 text-sm">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="mt-3"
                >
                  Try Again
                </Button>
              </div>
            ) : totalResults > 0 ? (
              <>
                {/* Conversations */}
                {results.conversations.length > 0 && (
                  <ResultSection
                    icon={MessageCircle}
                    title="Conversations"
                    count={results.conversations.length}
                    color="blue"
                  >
                    {results.conversations.map((conversation) => (
                      <ConversationItem
                        key={conversation._id}
                        conversation={conversation}
                        isActive={activeConversationId === conversation._id}
                        unreadCount={getUnreadCount?.(conversation._id) || 0}
                        onClick={handleConversationClick}
                      />
                    ))}
                  </ResultSection>
                )}

                {/* New Users */}
                {results.newUsers.length > 0 && (
                  <ResultSection
                    icon={UserPlus}
                    title="New Users"
                    count={results.newUsers.length}
                    color="green"
                  >
                    {results.newUsers.map((user) => (
                      <NewUserItem key={user._id} user={user} onSelect={handleUserSelect} />
                    ))}
                  </ResultSection>
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
