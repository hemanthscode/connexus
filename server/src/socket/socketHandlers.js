import User from '../core/models/User.js'

const connectedUsers = new Map()

export const handleConnection = (io) => async (socket) => {
  const userSockets = connectedUsers.get(socket.userId) || new Set()
  userSockets.add(socket.id)
  connectedUsers.set(socket.userId, userSockets)

  if (userSockets.size === 1) {
    await User.findByIdAndUpdate(socket.userId, { status: 'online', lastSeen: new Date() })
    socket.broadcast.emit('user_online', { userId: socket.userId, lastSeen: null })
  }

  try {
    const { default: Conversation } = await import('../core/models/Conversation.js')
    const conversations = await Conversation.find({ 'participants.user': socket.userId })
    conversations.forEach((c) => socket.join(c._id.toString()))
  } catch (error) {
    console.error('Room join error:', error)
  }

  const onlineUsersArray = Array.from(connectedUsers.keys()).map((uid) => ({ userId: uid }))
  socket.emit('current_online_users', onlineUsersArray)

  socket.on('join_conversation', async (conversationId) => {
    try {
      const { default: Conversation } = await import('../core/models/Conversation.js')
      const conversation = await Conversation.findById(conversationId)
      if (conversation && conversation.hasParticipant(socket.userId)) {
        socket.join(conversationId)
        socket.emit('joined_conversation', { conversationId })
      } else {
        socket.emit('error', { message: 'Not authorized to join this conversation' })
      }
    } catch {
      socket.emit('error', { message: 'Failed to join conversation' })
    }
  })

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId)
    socket.emit('left_conversation', { conversationId })
  })

  socket.on('send_message', async (data) => {
    try {
      const { conversationId, content, type = 'text' } = data
      const { default: Conversation } = await import('../core/models/Conversation.js')
      const { default: Message } = await import('../core/models/Message.js')
      const conversation = await Conversation.findById(conversationId)
      if (!conversation || !conversation.hasParticipant(socket.userId)) {
        return socket.emit('error', { message: 'Not authorized' })
      }
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
    socket.to(conversationId).emit('user_typing', {
      userId: socket.userId,
      user: socket.user.getPublicProfile(),
      conversationId,
    })
  })

  socket.on('typing_stop', ({ conversationId }) => {
    socket.to(conversationId).emit('user_stop_typing', {
      userId: socket.userId,
      conversationId,
    })
  })

  socket.on('mark_message_read', async ({ messageIds, conversationId }) => {
    const { default: Message } = await import('../core/models/Message.js')
    if (!Array.isArray(messageIds)) return
    try {
      for (const messageId of messageIds) {
        const message = await Message.findById(messageId)
        if (message) {
          await message.markAsRead(socket.userId)
        }
      }
      io.to(conversationId).emit('message_read', { conversationId, userId: socket.userId })
    } catch {
      socket.emit('error', { message: 'Failed to mark messages read' })
    }
  })

  socket.on('disconnect', async () => {
    const userSockets = connectedUsers.get(socket.userId)
    if (userSockets) {
      userSockets.delete(socket.id)
      if (userSockets.size === 0) {
        connectedUsers.delete(socket.userId)
        await User.findByIdAndUpdate(socket.userId, { status: 'offline', lastSeen: new Date() })
        socket.broadcast.emit('user_offline', { userId: socket.userId, lastSeen: new Date().toISOString() })
      } else {
        connectedUsers.set(socket.userId, userSockets)
      }
    }
  })
}
