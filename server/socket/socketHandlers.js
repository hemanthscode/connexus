import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import User from '../models/User.js'

// Store online users
const connectedUsers = new Map()

/**
 * Socket.IO Authentication Middleware (FIXED)
 */
export const authenticateSocket = async (socket, next) => {
  try {
    // Try multiple token sources
    let token = socket.handshake.auth.token || 
                socket.handshake.headers.authorization ||
                socket.handshake.query.token ||
                socket.request.headers.authorization
    
    // Remove 'Bearer ' prefix if present
    if (token && token.startsWith('Bearer ')) {
      token = token.substring(7)
    }
    
    if (!token) {
      console.log('❌ Socket auth failed: No token provided')
      return next(new Error('Authentication error - no token'))
    }
    
    console.log('🔍 Attempting to verify token:', token.substring(0, 20) + '...')
    
    const decoded = jwt.verify(token, config.JWT_SECRET)
    const user = await User.findById(decoded.userId).select('-password')
    
    if (!user || !user.isActive) {
      console.log('❌ Socket auth failed: Invalid user')
      return next(new Error('Authentication error - invalid user'))
    }
    
    socket.userId = user._id.toString()
    socket.user = user
    console.log('✅ Socket authenticated:', user.name)
    next()
  } catch (error) {
    console.log('❌ Socket auth error:', error.message)
    next(new Error('Authentication error: ' + error.message))
  }
}

/**
 * Handle socket connection (UPDATED)
 */
export const handleConnection = (io) => {
  return async (socket) => {
    console.log(`✅ User connected: ${socket.user.name} (${socket.id})`)
    
    // Store user connection
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user
    })
    
    // Update user status to online
    await User.findByIdAndUpdate(socket.userId, { 
      status: 'online',
      lastSeen: new Date()
    })
    
    // Join user to their conversation rooms
    try {
      const { default: Conversation } = await import('../models/Conversation.js')
      const conversations = await Conversation.find({
        'participants.user': socket.userId
      })
      
      conversations.forEach(conv => {
        socket.join(conv._id.toString())
        console.log(`📝 User ${socket.user.name} joined room: ${conv._id}`)
      })
    } catch (error) {
      console.error('Error joining rooms:', error)
    }
    
    // Notify other users that this user is online
    socket.broadcast.emit('user_online', {
      userId: socket.userId,
      user: socket.user.getPublicProfile()
    })
    
    /**
     * Handle joining a conversation
     */
    socket.on('join_conversation', async (conversationId) => {
      try {
        const { default: Conversation } = await import('../models/Conversation.js')
        const conversation = await Conversation.findById(conversationId)
        
        if (conversation && conversation.hasParticipant(socket.userId)) {
          socket.join(conversationId)
          console.log(`📝 User ${socket.user.name} joined conversation ${conversationId}`)
          
          socket.emit('joined_conversation', { conversationId })
        } else {
          socket.emit('error', { message: 'Not authorized to join this conversation' })
        }
      } catch (error) {
        console.error('Join conversation error:', error)
        socket.emit('error', { message: 'Failed to join conversation' })
      }
    })
    
    /**
     * Handle leaving a conversation
     */
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(conversationId)
      console.log(`📤 User ${socket.user.name} left conversation ${conversationId}`)
      socket.emit('left_conversation', { conversationId })
    })
    
    /**
     * Handle real-time message sending
     */
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, type = 'text' } = data
        
        console.log(`💬 Received message from ${socket.user.name}:`, content)
        
        // Validate conversation access
        const { default: Conversation } = await import('../models/Conversation.js')
        const { default: Message } = await import('../models/Message.js')
        
        const conversation = await Conversation.findById(conversationId)
        if (!conversation || !conversation.hasParticipant(socket.userId)) {
          return socket.emit('error', { message: 'Not authorized' })
        }
        
        // Create message
        const message = new Message({
          content,
          sender: socket.userId,
          conversation: conversationId,
          type
        })
        
        await message.save()
        await message.populate('sender', 'name email avatar')
        
        // Update conversation
        await conversation.updateLastMessage(content, socket.userId)
        
        // Emit to all users in the conversation
        io.to(conversationId).emit('new_message', {
          message: message.toObject(),
          conversationId
        })
        
        console.log(`✅ Message sent to conversation ${conversationId}`)
        
      } catch (error) {
        console.error('Send message error:', error)
        socket.emit('error', { message: 'Failed to send message' })
      }
    })
    
    /**
     * Handle typing indicators
     */
    socket.on('typing_start', ({ conversationId }) => {
      console.log(`⌨️ ${socket.user.name} started typing in ${conversationId}`)
      socket.to(conversationId).emit('user_typing', {
        userId: socket.userId,
        user: socket.user.getPublicProfile(),
        conversationId
      })
    })
    
    socket.on('typing_stop', ({ conversationId }) => {
      console.log(`⌨️ ${socket.user.name} stopped typing in ${conversationId}`)
      socket.to(conversationId).emit('user_stop_typing', {
        userId: socket.userId,
        conversationId
      })
    })
    
    /**
     * Handle message read status
     */
    socket.on('mark_message_read', async ({ messageId, conversationId }) => {
      try {
        const { default: Message } = await import('../models/Message.js')
        const message = await Message.findById(messageId)
        if (message) {
          await message.markAsRead(socket.userId)
          
          // Notify sender that message was read
          io.to(conversationId).emit('message_read', {
            messageId,
            readBy: socket.userId,
            readAt: new Date()
          })
          
          console.log(`✅ Message ${messageId} marked as read by ${socket.user.name}`)
        }
      } catch (error) {
        console.error('Mark message read error:', error)
      }
    })
    
    /**
     * Handle user disconnect
     */
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.user.name} (${socket.id})`)
      
      // Remove from connected users
      connectedUsers.delete(socket.userId)
      
      // Update user status to offline
      await User.findByIdAndUpdate(socket.userId, {
        status: 'offline',
        lastSeen: new Date()
      })
      
      // Notify other users that this user is offline
      socket.broadcast.emit('user_offline', {
        userId: socket.userId
      })
    })
  }
}

/**
 * Get online users
 */
export const getOnlineUsers = () => {
  return Array.from(connectedUsers.values()).map(conn => conn.user.getPublicProfile())
}

export default {
  authenticateSocket,
  handleConnection,
  getOnlineUsers
}
