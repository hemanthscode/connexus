import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext.jsx'

export const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const { token } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const socketRef = useRef(null)

  useEffect(() => {
    if (!token) return

    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token }
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Socket connected', socket.id)
    })

    socket.on('current_online_users', (users) => {
      setOnlineUsers(new Set(users.map(u => u.userId)))
    })

    socket.on('user_online', ({ userId }) => {
      setOnlineUsers(prev => new Set(prev).add(userId))
    })

    socket.on('user_offline', ({ userId }) => {
      setOnlineUsers(prev => {
        const copy = new Set(prev)
        copy.delete(userId)
        return copy
      })
    })

    socket.on('disconnect', () => {
      setOnlineUsers(new Set())
      console.log('Socket disconnected')
    })

    return () => {
      socket.disconnect()
    }
  }, [token])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocketContext = () => useContext(SocketContext)
