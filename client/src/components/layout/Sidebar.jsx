import { useState, useEffect } from 'react'
import { LucideMenu, LucideSearch, LucideUser } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useChat } from '../../contexts/ChatContext.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import ConversationItem from '../chat/ConversationItem.jsx'

export default function Sidebar() {
  const [open, setOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredConversations, setFilteredConversations] = useState([])
  const { conversations, activeConversation, setActiveConversation } = useChat()
  const { user, logout } = useAuth()

  useEffect(() => {
    const searchLower = searchTerm.trim().toLowerCase()
    if (!searchLower) {
      setFilteredConversations(conversations)
      return
    }
    const filtered = conversations.filter((conv) => {
      if (conv.type === 'group') {
        return conv.name.toLowerCase().includes(searchLower)
      }
      const other = conv.participants.find(p => p.user._id !== user._id)?.user
      return other?.name.toLowerCase().includes(searchLower) || other?.email.toLowerCase().includes(searchLower)
    })
    setFilteredConversations(filtered)
  }, [searchTerm, conversations, user._id])

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded bg-blue-600 text-white shadow-lg"
        aria-label="Toggle menu"
      >
        <LucideMenu size={24} />
      </button>

      <aside
        className={`fixed top-0 left-0 w-72 h-screen bg-white shadow-lg lg:shadow-none border-r border-gray-200 transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static flex flex-col p-4`}
      >
        <h1 className="text-blue-600 font-extrabold text-3xl uppercase text-center mb-8 select-none">
          Connexus
        </h1>

        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 mb-4 text-gray-700">
          <LucideSearch size={20} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 ml-3 bg-transparent border-none outline-none placeholder-gray-400"
            aria-label="Search conversations"
          />
        </div>

        <nav className="overflow-y-auto flex-1">
          <ul className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-transparent">
            {filteredConversations.map((conv) => (
              <ConversationItem
                key={conv._id}
                conversation={conv}
                active={activeConversation?._id === conv._id}
                currentUserId={user._id}
                unreadCount={conv.unreadCount}
                onClick={() => setActiveConversation(conv)}
              />
            ))}
            {filteredConversations.length === 0 && (
              <li className="text-gray-500 p-3 text-center select-none">
                No conversations found.
              </li>
            )}
          </ul>
        </nav>

        <div className="mt-auto flex justify-between items-center">
          <Link
            to="/profile"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            <LucideUser size={18} />
            Profile
          </Link>
          <button
            onClick={logout}
            className="px-6 py-2 text-white bg-red-600 rounded hover:bg-red-700 transition font-semibold"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
