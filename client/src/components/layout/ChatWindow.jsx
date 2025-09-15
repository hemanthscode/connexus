import { useEffect, useRef, useState } from 'react'
import Header from './Header.jsx'
import MessageBubble from '../chat/MessageBubble.jsx'
import MessageInput from '../chat/MessageInput.jsx'
import TypingIndicator from '../chat/TypingIndicator.jsx'
import { useChat } from '../../contexts/ChatContext.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'

export default function ChatWindow({ darkMode, toggleDarkMode }) {
  const { messages, sendMessage, activeConversation, socket } = useChat()
  const { user } = useAuth()
  const [typingUsers, setTypingUsers] = useState([])
  const messagesEndRef = useRef(null)
  const participant = activeConversation?.participants.find((p) => p.user._id !== user._id)?.user
  const isGroup = activeConversation?.type === 'group'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  useEffect(() => {
    if (!socket) return

    const handleUserTyping = (typingUser) => {
      if (typingUser.userId !== user._id) {
        setTypingUsers((prev) => [...prev.filter((u) => u.userId !== typingUser.userId), typingUser])
      }
    }
    const handleUserStopTyping = ({ userId }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId))
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
      <main
        className="flex flex-col flex-1 items-center justify-center text-[var(--color-text-dark)] bg-[var(--color-background-light)] dark:bg-backgroundDark rounded-l-lg p-6"
        role="main"
      >
        <p>Select a conversation to start chatting.</p>
      </main>
    )
  }

  return (
    <main className="flex flex-col flex-1 bg-[var(--color-background-light)] dark:bg-backgroundDark rounded-l-lg max-h-screen">
      <Header participant={participant} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <div
        className="flex-1 overflow-y-auto space-y-4 mb-4 pb-4 scrollbar-thin scrollbar-thumb-[var(--color-primary)] scrollbar-track-transparent scroll-smooth px-4 py-3 flex flex-col"
        role="log"
        aria-live="polite"
      >
        {messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            isMe={msg.sender._id === user._id}
            recipient={participant}
            activeConversationId={activeConversation._id}
            isGroup={isGroup}
          />
        ))}
        <div ref={messagesEndRef} />
        {typingUsers.length > 0 && <TypingIndicator />}
      </div>
      <MessageInput sendMessage={sendMessage} />
    </main>
  )
}
