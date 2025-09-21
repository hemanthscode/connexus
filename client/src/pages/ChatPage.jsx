import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useSocket } from '../hooks/useSocket.js'
import { useNavigate } from 'react-router-dom'
import api from '../service/api.js'
import {
  MessageCircle,
  Users,
  Settings,
  Search,
  Send,
  Smile,
  User,
  LogOut,
  Zap,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const ChatPage = () => {
  const { token, user, logout } = useAuth()
  const { socket, onlineUsers, typingUsers, emitTypingStart, emitTypingStop } = useSocket()
  const navigate = useNavigate()
  const messagesEndRef = useRef(null)

  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  useEffect(scrollToBottom, [messages])

  // Load conversations
  useEffect(() => {
    if (!token) return
    api
      .get('/chat/conversations', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setConversations(res.data.data))
      .catch(console.error)
  }, [token])

  // Load messages on conversation select
  useEffect(() => {
    if (!selectedConversation || !token) return
    api
      .get(`/chat/conversations/${selectedConversation._id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMessages(res.data.data))
      .catch(console.error)
  }, [selectedConversation, token])

  // Socket event listeners for new messages and typing
  useEffect(() => {
    if (!socket) return
    const handleNewMessage = ({ conversationId, message }) => {
      if (selectedConversation?._id === conversationId) {
        setMessages((prev) => [...prev, message])
      }
      setConversations((prev) =>
        prev.map((c) => (c._id === conversationId ? { ...c, lastMessage: message.content } : c))
      )
    }
    const handleTyping = ({ conversationId, isTyping }) => {
      if (selectedConversation?._id === conversationId) {
        setIsTyping(isTyping)
      }
    }

    socket.on('new_message', handleNewMessage)
    socket.on('typing', handleTyping)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('typing', handleTyping)
    }
  }, [socket, selectedConversation])

  // Send message handler
  const sendMessage = (e) => {
    e.preventDefault()
    if (!messageInput.trim() || !selectedConversation) return

    const messageObj = {
      conversationId: selectedConversation._id,
      content: messageInput.trim(),
      type: 'text',
    }
    socket?.emit('send_message', messageObj)

    setMessages((prev) => [
      ...prev,
      {
        content: messageInput,
        sender: user,
        _id: 'temp-' + Date.now(),
        createdAt: new Date(),
        type: 'text',
      },
    ])
    setMessageInput('')
    emitTypingStop(selectedConversation._id)
  }

  // Typing event emitters with debounce
  useEffect(() => {
    if (!socket || !selectedConversation) return
    if (messageInput.length === 0) {
      emitTypingStop(selectedConversation._id)
      return
    }
    emitTypingStart(selectedConversation._id)

    const timeoutId = setTimeout(() => {
      emitTypingStop(selectedConversation._id)
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [messageInput, selectedConversation, socket, emitTypingStart, emitTypingStop])

  // Filter conversations based on search term
  const filteredConversations = conversations.filter((c) =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Profile page navigation
  const goToProfile = () => navigate('/profile')

  return (
    <div className="flex flex-col h-screen bg-black relative overflow-hidden">
      {/* Cyberpunk Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 255, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(circle at 10% 20%, rgba(0, 255, 255, 0.05) 0%, transparent 50%)',
              'radial-gradient(circle at 90% 80%, rgba(255, 0, 255, 0.05) 0%, transparent 50%)',
              'radial-gradient(circle at 10% 20%, rgba(0, 255, 255, 0.05) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      {/* Floating cyber elements */}
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400/60 rotate-45 z-10"
          animate={{
            y: [-10, -80, -10],
            x: [0, 20, 0],
            rotate: [0, 360],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 8 + i,
            repeat: Infinity,
            delay: i * 0.5,
          }}
          style={{
            left: `${20 + i * 20}%`,
            top: `${30 + (i % 2) * 40}%`,
          }}
        />
      ))}

      {/* Top Navbar */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-20 flex items-center justify-between p-4 border-b border-cyan-400/20 backdrop-blur-sm"
        style={{
          background: 'linear-gradient(90deg, rgba(0,0,0,0.9), rgba(0,20,40,0.9), rgba(0,0,0,0.9))',
          boxShadow: '0 0 0 1px rgba(0, 255, 255, 0.2), 0 4px 20px rgba(0, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-center space-x-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <MessageCircle className="text-cyan-400 h-7 w-7" />
          </motion.div>
          <h1
            className="text-2xl font-bold"
            style={{
              background: 'linear-gradient(45deg, #00ffff, #ff00ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            CONNEXUS
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.1, boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)' }}
            whileTap={{ scale: 0.95 }}
            onClick={goToProfile}
            className="p-3 border border-cyan-400/30 bg-black/50 hover:bg-cyan-400/10 transition-all relative group"
            style={{
              clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
            }}
          >
            <User className="text-cyan-400 h-5 w-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1, boxShadow: '0 0 15px rgba(255, 0, 100, 0.5)' }}
            whileTap={{ scale: 0.95 }}
            onClick={logout}
            className="p-3 border border-red-400/30 bg-black/50 hover:bg-red-400/10 transition-all"
            style={{
              clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
            }}
          >
            <LogOut className="text-red-400 h-5 w-5" />
          </motion.button>
        </div>
      </motion.nav>

      {/* Main Content: Sidebar + Chat */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        <motion.aside
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-80 flex flex-col border-r border-cyan-400/20 backdrop-blur-sm"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,20,40,0.9))',
            boxShadow: 'inset -1px 0 0 rgba(0, 255, 255, 0.2)',
          }}
        >
          <div className="p-4">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 text-cyan-400/60 -translate-y-1/2 pointer-events-none" />
              <motion.input
                whileFocus={{ scale: 1.02, boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)' }}
                type="text"
                placeholder="Search neural networks..."
                className="w-full pl-10 pr-4 py-3 bg-black/50 border border-cyan-400/30 text-cyan-100 placeholder-gray-500 backdrop-blur-sm transition-all focus:border-cyan-400 focus:outline-none"
                style={{
                  clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                  background: 'linear-gradient(145deg, rgba(0,0,0,0.8), rgba(0,20,40,0.8))',
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <AnimatePresence>
              {filteredConversations.length === 0 ? (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-400 p-4 text-center">
                  No data streams found.
                </motion.p>
              ) : (
                filteredConversations.map((convo, index) => (
                  <motion.div
                    key={convo._id}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedConversation(convo)}
                    className={`cursor-pointer p-4 border-b border-cyan-400/10 transition-all flex items-center space-x-3 relative group ${
                      selectedConversation?._id === convo._id ? 'bg-cyan-400/20' : 'hover:bg-cyan-400/10'
                    }`}
                    whileHover={{ x: 6 }}
                  >
                    {selectedConversation?._id === convo._id && (
                      <motion.div
                        layoutId="selectedConvo"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400"
                        style={{ boxShadow: '0 0 10px rgba(0, 255, 255, 0.6)' }}
                      />
                    )}

                    <div className="relative">
                      <div className="text-2xl">{convo.avatar || '👤'}</div>
                      <motion.div
                        className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{ display: 'none' }} // Show when user is online
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="truncate text-cyan-100 font-semibold">{convo.name || 'Unknown Entity'}</h3>
                        <span className="text-xs text-gray-400 font-mono">
                          {new Date(convo.lastMessage?.timestamp || convo.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="truncate text-gray-400 text-sm">{convo.lastMessage?.content || 'No transmissions yet'}</p>
                    </div>

                    {convo.unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center justify-center bg-cyan-400 text-black text-xs rounded-full min-w-[20px] h-5 px-1 font-bold"
                        style={{ boxShadow: '0 0 10px rgba(0, 255, 255, 0.6)' }}
                      >
                        {convo.unreadCount}
                      </motion.span>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col relative">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center justify-between p-4 border-b border-cyan-400/20 backdrop-blur-sm relative"
                style={{
                  background: 'linear-gradient(90deg, rgba(0,0,0,0.9), rgba(0,20,40,0.9))',
                  boxShadow: '0 1px 0 rgba(0, 255, 255, 0.2)',
                }}
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="text-3xl">{selectedConversation.avatar || '👤'}</div>
                    <motion.div
                      className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-black"
                      animate={{
                        boxShadow: ['0 0 5px rgba(0, 255, 136, 0.5)', '0 0 15px rgba(0, 255, 136, 0.8)', '0 0 5px rgba(0, 255, 136, 0.5)'],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <div>
                    <h2 className="text-cyan-100 font-bold text-lg">{selectedConversation.name}</h2>
                    <p className="text-xs text-green-400 font-mono">NEURAL LINK ACTIVE</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.1, boxShadow: '0 0 10px rgba(0, 255, 255, 0.4)' }}
                    className="p-2 border border-cyan-400/30 bg-black/50 hover:bg-cyan-400/10 transition-all text-cyan-400"
                    style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                  >
                    <Users className="h-4 w-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1, boxShadow: '0 0 10px rgba(0, 255, 255, 0.4)' }}
                    className="p-2 border border-cyan-400/30 bg-black/50 hover:bg-cyan-400/10 transition-all text-cyan-400"
                    style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                  >
                    <Settings className="h-4 w-4" />
                  </motion.button>
                </div>
              </motion.header>

              {/* Messages */}
              <section className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4 relative">
                <AnimatePresence>
                  {messages.map((msg, index) => (
                    <motion.div
                      key={msg._id || msg.id}
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex ${msg.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md break-words px-4 py-3 relative ${
                          msg.sender._id === user._id ? 'bg-cyan-400/20 text-cyan-100 border border-cyan-400/30' : 'bg-black/50 text-white border border-gray-600/30'
                        }`}
                        style={{
                          clipPath: msg.sender._id === user._id
                            ? 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
                            : 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
                          boxShadow: msg.sender._id === user._id ? '0 0 15px rgba(0, 255, 255, 0.2)' : '0 0 10px rgba(0, 0, 0, 0.3)',
                        }}
                      >
                        <motion.div
                          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
                          style={{
                            background: msg.sender._id === user._id
                              ? 'linear-gradient(45deg, rgba(0, 255, 255, 0.1), rgba(0, 200, 255, 0.1))'
                              : 'linear-gradient(45deg, rgba(255, 255, 255, 0.05), rgba(200, 200, 200, 0.05))',
                            clipPath: msg.sender._id === user._id
                              ? 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
                              : 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
                          }}
                        />
                        <p className="text-sm whitespace-pre-wrap relative z-10">{msg.content}</p>
                        <span className="block text-xs opacity-60 mt-1 text-right font-mono relative z-10">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing indicator */}
                <AnimatePresence>
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex justify-start"
                    >
                      <div
                        className="bg-black/50 border border-gray-600/30 px-4 py-3 max-w-md"
                        style={{ clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)' }}
                      >
                        <div className="flex space-x-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 bg-cyan-400 rounded-full"
                              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </section>

              {/* Message Input */}
              <motion.form
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                onSubmit={sendMessage}
                className="p-4 border-t border-cyan-400/20 flex items-center space-x-3 backdrop-blur-sm relative"
                style={{
                  background: 'linear-gradient(90deg, rgba(0,0,0,0.9), rgba(0,20,40,0.9))',
                  boxShadow: '0 -1px 0 rgba(0, 255, 255, 0.2)',
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  className="p-3 border border-cyan-400/30 bg-black/50 hover:bg-cyan-400/10 transition-all text-cyan-400"
                  style={{
                    clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                  }}
                >
                  <Smile className="h-5 w-5" />
                </motion.button>

                <motion.input
                  whileFocus={{ scale: 1.01, boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)' }}
                  type="text"
                  placeholder="Transmit your thoughts..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 px-4 py-3 bg-black/50 border border-cyan-400/30 text-cyan-100 placeholder-gray-500 backdrop-blur-sm transition-all focus:border-cyan-400 focus:outline-none"
                  style={{
                    clipPath: 'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px))',
                    background: 'linear-gradient(145deg, rgba(0,0,0,0.8), rgba(0,20,40,0.8))',
                  }}
                  autoComplete="off"
                />

                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0, 255, 136, 0.6)' }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="p-3 border border-green-400/50 bg-black/50 hover:bg-green-400/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-green-400 relative overflow-hidden"
                  style={{ clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)' }}
                >
                  <motion.div
                    className="absolute inset-0 bg-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)' }}
                  />
                  <motion.div
                    animate={messageInput.trim() ? { rotate: [0, 360] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="relative z-10"
                  >
                    <Send className="h-5 w-5" />
                  </motion.div>
                </motion.button>
              </motion.form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
                <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
                  <Zap className="h-16 w-16 text-cyan-400/60 mx-auto" />
                </motion.div>
                <p className="text-gray-400 text-lg">Select a neural pathway to begin transmission</p>
                <p className="text-xs text-gray-500 font-mono">AWAITING CONNECTION...</p>
              </motion.div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #00ffff, #ff00ff);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #ff00ff, #00ffff);
        }
      `}</style>
    </div>
  )
}

export default ChatPage