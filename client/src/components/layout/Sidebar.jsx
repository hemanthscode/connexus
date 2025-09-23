import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import ConversationList from '../chat/ConversationList.jsx';
import Avatar from '../common/Avatar.jsx';
import { LogOut, Search } from 'lucide-react';
import { searchUsers, getConversations } from '../../services/chatApi.js';
import toast from 'react-hot-toast';

const debounce = (fn, ms) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
};

const Sidebar = ({
  selectedConversationId,
  onSelectConversation,
  onSelectPendingDirectUser,
  className = '',
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);

  const debouncedSearch = useRef(
    debounce(async (query) => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const users = await searchUsers(query);
        setSearchResults(users);
      } catch {
        setSearchResults([]);
        toast.error('Failed to search users');
      }
    }, 300)
  ).current;

  useEffect(() => {
    const fetchConvos = async () => {
      setLoadingConversations(true);
      try {
        const convos = await getConversations();
        setConversations(convos);
      } catch {
        setConversations([]);
        toast.error('Failed to load conversations');
      } finally {
        setLoadingConversations(false);
      }
    };
    fetchConvos();
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    debouncedSearch(val.trim());
  };

  const handleUserSelect = (userToChat) => {
    setSearchTerm('');
    setSearchResults([]);
    onSelectPendingDirectUser?.(userToChat);
  };

  return (
    <aside
      className={`flex flex-col w-72 bg-white border-r border-gray-300 shadow-lg h-full overflow-y-auto ${className}`}
    >
      <div className="flex-none p-6 border-b border-gray-200 select-none text-2xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-700">
        Connexus
      </div>

      <div className="flex-none p-4 border-b border-gray-200">
        <div className="relative">
          <Search
            className="w-5 h-5 absolute left-3 top-3 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search users or conversations..."
            value={searchTerm}
            onChange={handleSearchChange}
            spellCheck={false}
            autoComplete="off"
            aria-label="Search conversations or users"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
          />
        </div>
      </div>

      {searchTerm.length >= 2 && (
        <nav
          aria-label="Search results"
          className="max-h-48 overflow-y-auto border-b border-gray-200 bg-white divide-y divide-gray-200"
        >
          {searchResults.length === 0 && (
            <div className="p-3 text-gray-500 select-none">No users found</div>
          )}
          {searchResults.map(result => (
            <button
              key={result._id}
              onClick={() => handleUserSelect(result)}
              className="w-full text-left p-3 hover:bg-indigo-50 flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              type="button"
              aria-label={`Start chat with ${result.name}`}
            >
              <Avatar src={result.avatar} alt={result.name} size={32} />
              <div className="flex flex-col truncate">
                <span className="font-medium truncate">{result.name}</span>
                <span className="text-xs text-gray-500 truncate">{result.email}</span>
              </div>
            </button>
          ))}
        </nav>
      )}

      <nav aria-label="Conversations" className="flex-1 overflow-y-auto bg-white">
        {loadingConversations ? (
          <div className="p-4 text-gray-600 select-none">Loading conversations...</div>
        ) : (
          <ConversationList
            selectedId={selectedConversationId}
            onSelectConversation={onSelectConversation}
            conversations={conversations}
          />
        )}
      </nav>

      <footer className="flex-none p-4 border-t border-gray-200 flex items-center justify-between bg-white">
        <button
          onClick={() => navigate('/profile')}
          aria-label="Go to profile"
          className="focus:outline-none focus:ring-2 focus:ring-indigo-600 rounded"
        >
          <Avatar
            src={user?.avatar}
            alt={user?.name || 'User'}
            size={40}
            initials={
              !user?.avatar && user?.name
                ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
                : undefined
            }
          />
        </button>
        <button
          onClick={logout}
          aria-label="Logout"
          title="Logout"
          className="p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-600 text-red-600"
        >
          <LogOut className="w-6 h-6" aria-hidden="true" />
        </button>
      </footer>
    </aside>
  );
};

export default Sidebar;
