import { io } from 'socket.io-client'

let socket = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 10
const RECONNECT_BASE_DELAY = 1000

let outboundQueue = []
let isConnected = false

function createSocket(token) {
  const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    auth: { token },
    transports: ['websocket'],
    reconnection: false,
  })

  newSocket.on('connect', () => {
    reconnectAttempts = 0
    isConnected = true
    flushQueue()
  })

  newSocket.on('disconnect', () => {
    isConnected = false
    attemptReconnect()
  })

  newSocket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message)
  })

  return newSocket
}

function attemptReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('Max reconnect attempts reached.')
    return
  }
  const delay = RECONNECT_BASE_DELAY * 2 ** reconnectAttempts
  reconnectAttempts++
  setTimeout(() => {
    socket = createSocket(socket.auth?.token)
  }, delay)
}

function flushQueue() {
  if (!isConnected || !socket) return
  while (outboundQueue.length) {
    const { event, data } = outboundQueue.shift()
    socket.emit(event, data)
  }
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
  if (socket) {
    socket.disconnect()
    socket = null
    isConnected = false
    reconnectAttempts = 0
    outboundQueue = []
  }
}

export function emitWithQueue(event, data) {
  if (socket && isConnected) {
    socket.emit(event, data)
  } else {
    outboundQueue.push({ event, data })
  }
}
