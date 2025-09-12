import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import User from '../models/User.js'

const connectedUsers = new Map()

export const authenticateSocket = async (socket, next) => {
  try {
    let token = socket.handshake.auth.token || socket.handshake.headers.authorization || socket.handshake.query.token
    if (token?.startsWith('Bearer ')) token = token.slice(7)
    if (!token) return next(new Error('Authentication error - no token'))

    const decoded = jwt.verify(token, config.JWT_SECRET)
    const user = await User.findById(decoded.userId).select('-password')
    if (!user || !user.isActive) return next(new Error('Authentication error - invalid user'))

    socket.userId = user._id.toString()
    socket.user = user
    next()
  } catch (error) {
    next(new Error('Authentication error: ' + error.message))
  }
}

export const handleConnection = io => async socket => {
  connectedUsers.set(socket.userId, { socketId: socket.id, user: socket.user })
  await User.findByIdAndUpdate(socket.userId, { status: 'online', lastSeen: new Date() })

  try {
    const { default: Conversation } = await import('../models/Conversation.js')
    const conversations = await Conversation.find({ 'participants.user': socket.userId })
    conversations.forEach(c => socket.join(c._id.toString()))
  } catch (error) {
    console.error('Room join error:', error)
  }

  socket.broadcast.emit('user_online', { userId: socket.userId, user: socket.user.getPublicProfile() })

  socket.on('join_conversation', async conversationId => {
    const { default: Conversation } = await import('../models/Conversation.js')
    const conversation = await Conversation.findById(conversationId)
    if (conversation && conversation.hasParticipant(socket.userId)) {
      socket.join(conversationId)
      socket.emit('joined_conversation', { conversationId })
    } else socket.emit('error', { message: 'Not authorized to join this conversation' })
  })

  socket.on('leave_conversation', conversationId => {
    socket.leave(conversationId)
    socket.emit('left_conversation', { conversationId })
  })

  socket.on('send_message', async data => {
    try {
      const { conversationId, content, type = 'text' } = data
      const { default: Conversation } = await import('../models/Conversation.js')
      const { default: Message } = await import('../models/Message.js')
      const conversation = await Conversation.findById(conversationId)
      if (!conversation || !conversation.hasParticipant(socket.userId)) return socket.emit('error', { message: 'Not authorized' })
      const message = new Message({ content, sender: socket.userId, conversation: conversationId, type })
      await message.save()
      await message.populate('sender', 'name email avatar')
      await conversation.updateLastMessage(content, socket.userId)
      io.to(conversationId).emit('new_message', { message: message.toObject(), conversationId })
    } catch {
      socket.emit('error', { message: 'Failed to send message' })
    }
  })

  socket.on('typing_start', ({ conversationId }) => {
    socket.to(conversationId).emit('user_typing', { userId: socket.userId, user: socket.user.getPublicProfile(), conversationId })
  })

  socket.on('typing_stop', ({ conversationId }) => {
    socket.to(conversationId).emit('user_stop_typing', { userId: socket.userId, conversationId })
  })

  socket.on('mark_message_read', async ({ messageId, conversationId }) => {
    const { default: Message } = await import('../models/Message.js')
    const message = await Message.findById(messageId)
    if (message) {
      await message.markAsRead(socket.userId)
      io.to(conversationId).emit('message_read', { messageId, readBy: socket.userId, readAt: new Date() })
    }
  })

  socket.on('disconnect', async () => {
    connectedUsers.delete(socket.userId)
    await User.findByIdAndUpdate(socket.userId, { status: 'offline', lastSeen: new Date() })
    socket.broadcast.emit('user_offline', { userId: socket.userId })
  })
}

export default { authenticateSocket, handleConnection }
