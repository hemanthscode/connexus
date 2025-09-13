import { useState, useRef, useEffect } from 'react'
import { LucideSend } from 'lucide-react'
import { useChat } from '../../contexts/ChatContext.jsx'

export default function MessageInput({ sendMessage }) {
  const [input, setInput] = useState('')
  const typingTimeout = useRef(null)
  const { socket, activeConversation } = useChat()

  const isOffline = !socket || socket.disconnected

  // Handle typing events with debounce
  useEffect(() => {
    if (!socket || !activeConversation) return

    if (input.trim()) {
      socket.emit('typing_start', { conversationId: activeConversation._id })
      clearTimeout(typingTimeout.current)
      typingTimeout.current = setTimeout(() => {
        socket.emit('typing_stop', { conversationId: activeConversation._id })
      }, 2000)
    } else {
      socket.emit('typing_stop', { conversationId: activeConversation._id })
    }

    return () => clearTimeout(typingTimeout.current)
  }, [input, socket, activeConversation])

  const onSend = e => {
    e.preventDefault()
    if (!input.trim() || isOffline) return
    sendMessage(input.trim())
    setInput('')
  }

  return (
    <form onSubmit={onSend} className="flex items-center gap-3 border-t border-gray-300 p-3 bg-white">
      <input
        type="text"
        placeholder={isOffline ? 'Offline - messages disabled' : 'Type a message...'}
        className="flex-1 rounded-full border border-gray-300 px-6 py-3 text-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
        value={input}
        onChange={e => setInput(e.target.value)}
        autoComplete="off"
        disabled={isOffline}
        aria-disabled={isOffline}
        aria-label="Message input"
      />
      <button
        type="submit"
        className={`p-3 rounded-full bg-teal-500 text-white hover:bg-teal-600 transition ${
          isOffline ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        disabled={isOffline}
        aria-label="Send message"
      >
        <LucideSend size={20} />
      </button>
    </form>
  )
}
