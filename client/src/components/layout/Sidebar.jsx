import { useState, useEffect } from 'react'
import { LucideMenu, LucideSearch, LucideUser } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useChat } from '../../contexts/ChatContext.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import ConversationItem from '../chat/ConversationItem.jsx'
import * as userService from '../../services/userService.js'
import { debounce } from '../../utils/debounce.js'

export default function Sidebar() {
  const [open, setOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const { conversations, activeConversation, setActiveConversation } = useChat()
  const { user, logout, token } = useAuth()

  const debouncedSearch = debounce(q => {
    if (q.length < 3) {
      setSearchResults([])
      return
    }
    userService.searchUsers(q, token).then(setSearchResults).catch(() => setSearchResults([]))
  }, 400)

  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm])

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded bg-teal-500 text-white shadow-lg"
        aria-label="Toggle menu"
      >
        <LucideMenu size={24} />
      </button>
      <aside
        className={`fixed top-0 left-0 w-72 h-screen bg-white border-r border-slate-300 transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static flex flex-col p-5`}
      >
        <h1 className="text-teal-600 font-extrabold text-3xl uppercase mb-8 text-center select-none">Connexus</h1>
        <div className="flex items-center bg-slate-100 rounded-full px-4 py-2 mb-6 text-slate-700">
          <LucideSearch size={20} />
          <input
            type="search"
            placeholder="Search users..."
            className="flex-1 ml-3 bg-transparent placeholder-slate-500 focus:outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            aria-label="Search users"
          />
        </div>
        {searchResults.length > 0 && (
          <div className="bg-slate-50 rounded p-2 mb-6 max-h-48 overflow-y-auto">
            {searchResults.map(u => (
              <div
                key={u._id}
                className="flex items-center p-2 cursor-pointer hover:bg-teal-100 rounded text-teal-900"
                onClick={() => {
                  setSearchTerm('')
                  setSearchResults([])
                  // TODO: Create or switch to direct conversation with u._id
                }}
                role="button"
                tabIndex={0}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setActiveConversation(u)}
                aria-label={`Start chat with ${u.name}`}
              >
                <img
                  src={u.avatar || '/default-avatar.png'}
                  alt={u.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="ml-3 truncate">{u.name}</span>
                <span className="ml-auto text-sm text-slate-500 capitalize">{u.status}</span>
              </div>
            ))}
          </div>
        )}
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-3">
            {conversations.map(conv => (
              <ConversationItem
                key={conv._id}
                conversation={conv}
                active={activeConversation?._id === conv._id}
                onClick={() => setActiveConversation(conv)}
                currentUserId={user._id}
                unreadCount={conv.unreadCount}
              />
            ))}
          </ul>
        </nav>
        <div className="mt-6 flex justify-between">
          <Link
            to="/profile"
            className="flex items-center space-x-2 px-4 py-2 bg-teal-500 text-white font-semibold rounded hover:bg-teal-600 transition"
            aria-label="Go to user profile"
          >
            <LucideUser size={18} />
            <span>Profile</span>
          </Link>
          <button
            onClick={logout}
            className="px-6 py-2 rounded bg-teal-500 text-white font-semibold hover:bg-teal-600 transition"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
