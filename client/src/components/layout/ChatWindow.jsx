import { useState, useEffect, useRef } from 'react'
import { useChat } from '../../contexts/ChatContext.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import Header from './Header.jsx'
import MessageBubble from '../chat/MessageBubble.jsx'
import MessageInput from '../chat/MessageInput.jsx'
import TypingIndicator from '../chat/TypingIndicator.jsx'

export default function ChatWindow({ darkMode, toggleDarkMode }) {
  const { messages, sendMessage, activeConversation, socket } = useChat()
  const { user } = useAuth()
  const [typingUsers, setTypingUsers] = useState([])
  const messagesEndRef = useRef(null)
  
  // Find the other participant in the conversation
  const participant = activeConversation?.participants.find(p => p.user._id !== user._id)?.user

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  // Typing event listeners
  useEffect(() => {
    if (!socket) return

    const handleUserTyping = (typingUser) => {
      if (typingUser.userId !== user._id) {
        setTypingUsers((prev) => [...prev.filter(u => u.userId !== typingUser.userId), typingUser])
      }
    }
    const handleUserStopTyping = ({ userId }) => {
      setTypingUsers((prev) => prev.filter(u => u.userId !== userId))
    }
    socket.on('user_typing', handleUserTyping)
    socket.on('user_stop_typing', handleUserStopTyping)

    return () => {
      socket.off('user_typing', handleUserTyping)
      socket.off('user_stop_typing', handleUserStopTyping)
    }
  }, [socket, user._id])

  if (!activeConversation) {
    return (
      <main className="flex flex-col flex-1 items-center justify-center text-gray-400 bg-black/20 backdrop-blur-md rounded-l-lg p-6">
        <p>Please select a conversation to start chatting.</p>
      </main>
    )
  }

  return (
    <main className="flex flex-col flex-1 bg-black/20 backdrop-blur-md rounded-l-lg p-0 max-h-screen">
      <Header participant={participant} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pb-4 scrollbar-thin scrollbar-thumb-[#39FF14]/60 scrollbar-track-transparent scroll-smooth px-4 py-3 flex flex-col">
        {messages.map(msg => (
          <MessageBubble
            key={msg._id}
            message={msg}
            isMe={msg.sender._id === user._id}
            recipient={participant}
          />
        ))}
        <div ref={messagesEndRef} />
        {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}
      </div>
      <MessageInput sendMessage={sendMessage} />
    </main>
  )
}
