// src/components/common/UserSearch.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useChat } from '../../contexts/ChatContext.jsx'
import { searchUsers, createDirectConversation } from '../../services/chatService.js'

export default function UserSearch({ onConversationCreated }) {
  const { token } = useAuth()
  const { conversations, addOrActivateConversation } = useChat()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }
    let active = true
    setLoading(true)

    searchUsers(query, token)
      .then((users) => {
        if (!active) return
        setResults(users)
        setError(null)
      })
      .catch((err) => {
        if (!active) return
        setError(err.message || 'Search failed')
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [query, token])

  const handleUserClick = async (user) => {
    try {
      setLoading(true)
      const conversation = await createDirectConversation(user._id, token)
      const existing = conversations.find((c) => c._id === conversation._id)

      if (!existing) {
        addOrActivateConversation(conversation)
        onConversationCreated && onConversationCreated(conversation)
      } else {
        addOrActivateConversation(existing)
      }
      setQuery('')
      setResults([])
    } catch (e) {
      setError(e.message || 'Failed to start conversation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <input
        type="search"
        placeholder="Search users to chat..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Search users"
        autoComplete="off"
      />
      {loading && <div className="text-sm text-gray-500 mt-1">Searching...</div>}
      {error && <div className="text-sm text-red-600 mt-1">{error}</div>}
      {results.length > 0 && (
        <ul className="absolute z-10 bg-white border border-gray-300 rounded w-full mt-1 max-h-48 overflow-auto shadow-lg" role="listbox">
          {results.map((user) => (
            <li
              key={user._id}
              className="p-2 hover:bg-primaryLight cursor-pointer truncate"
              onClick={() => handleUserClick(user)}
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleUserClick(user)}
              aria-label={`Chat with ${user.name}`}
              role="option"
            >
              {user.name} ({user.email})
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
