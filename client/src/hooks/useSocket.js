// src/hooks/useSocket.js
import { useEffect } from 'react'

export default function useSocket(socket, event, callback) {
  useEffect(() => {
    if (!socket) return
    socket.on(event, callback)
    return () => {
      socket.off(event, callback)
    }
  }, [socket, event, callback])
}
