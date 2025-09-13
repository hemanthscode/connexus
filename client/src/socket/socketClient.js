import { io } from 'socket.io-client'

let socket = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 10
const RECONNECT_BASE_DELAY = 1000 // 1 second base

let outboundQueue = []
let isConnected = false

function createSocket(token) {
  const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    auth: { token },
    transports: ['websocket'],
    reconnection: false // manual reconnection for custom backoff
  })

  newSocket.on('connect', () => {
    console.log('Socket connected:', newSocket.id)
    reconnectAttempts = 0
    isConnected = true
    flushQueue()
    // Emit heartbeat ping every 25 seconds
    heartbeat()
  })

  newSocket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason)
    isConnected = false
    // Try to reconnect with exponential backoff
    attemptReconnect(newSocket, token)
  })

  newSocket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message)
  })

  return newSocket
}

function attemptReconnect(socketInstance, token) {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('Max reconnect attempts reached, giving up.')
    return
  }
  const delay = RECONNECT_BASE_DELAY * 2 ** reconnectAttempts
  reconnectAttempts += 1
  setTimeout(() => {
    console.log(`Reconnecting attempt ${reconnectAttempts}...`)
    socket = createSocket(token)
  }, delay)
}

function flushQueue() {
  if (!isConnected || !socket) return
  while (outboundQueue.length > 0) {
    const { event, data } = outboundQueue.shift()
    socket.emit(event, data)
  }
}

// Heartbeat ping/pong
let heartbeatIntervalId
function heartbeat() {
  clearInterval(heartbeatIntervalId)
  if (!socket || !isConnected) return
  heartbeatIntervalId = setInterval(() => {
    if (socket && isConnected) {
      socket.emit('heartbeat_ping')
    }
  }, 25000)
}

export function initiateSocket(token) {
  if (socket) return socket
  socket = createSocket(token)
  return socket
}

export function getSocket() {
  return socket
}

export function disconnectSocket() {
  clearInterval(heartbeatIntervalId)
  if (socket) {
    socket.disconnect()
    socket = null
    isConnected = false
    reconnectAttempts = 0
    outboundQueue = []
  }
}

// Emit event with queueing if offline
export function emitWithQueue(event, data) {
  if (socket && isConnected) {
    socket.emit(event, data)
  } else {
    outboundQueue.push({ event, data })
  }
}
