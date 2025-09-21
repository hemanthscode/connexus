import { useContext, useEffect, useState, useCallback } from 'react'
import { SocketContext } from '../context/SocketContext.jsx'

export const useSocket = () => {
  const { socket, onlineUsers } = useContext(SocketContext)
  const [typingUsers, setTypingUsers] = useState(new Set())

  const emitTypingStart = useCallback(
    (conversationId) => {
      if (socket && conversationId) {
        socket.emit('typing_start', { conversationId })
      }
    },
    [socket]
  )

  const emitTypingStop = useCallback(
    (conversationId) => {
      if (socket && conversationId) {
        socket.emit('typing_stop', { conversationId })
      }
    },
    [socket]
  )

  useEffect(() => {
    if (!socket) return

    const onUserTyping = ({ userId, conversationId }) => {
      setTypingUsers(prev => new Set(prev).add(userId))
    }

    const onUserStopTyping = ({ userId, conversationId }) => {
      setTypingUsers(prev => {
        const updated = new Set(prev)
        updated.delete(userId)
        return updated
      })
    }

    socket.on('user_typing', onUserTyping)
    socket.on('user_stop_typing', onUserStopTyping)

    return () => {
      socket.off('user_typing', onUserTyping)
      socket.off('user_stop_typing', onUserStopTyping)
    }
  }, [socket])

  return {
    socket,
    onlineUsers,
    typingUsers,
    emitTypingStart,
    emitTypingStop,
  }
}
