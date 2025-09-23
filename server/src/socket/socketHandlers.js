import User from '../core/models/User.js';

const connectedUsers = new Map();

/**
 * Handles Socket.IO connections.
 * Manages user status, rooms, message events, typing indicators, reactions.
 */
export const handleConnection = (io) => async (socket) => {
  // Track connected sockets per user for multi-device support
  const userSockets = connectedUsers.get(socket.userId) || new Set();
  userSockets.add(socket.id);
  connectedUsers.set(socket.userId, userSockets);

  // If this is the first socket connection of the user, update status to online
  if (userSockets.size === 1) {
    await User.findByIdAndUpdate(socket.userId, {
      status: 'online',
      lastSeen: new Date(),
    });
    socket.broadcast.emit('user_online', {
      userId: socket.userId,
      lastSeen: null,
    });
  }

  // Join rooms for all conversations user participates in, for scoped messaging
  try {
    const { default: Conversation } = await import('../core/models/Conversation.js');
    const conversations = await Conversation.find({
      'participants.user': socket.userId,
    });
    conversations.forEach((c) => {
      socket.join(c._id.toString());
    });
  } catch (error) {
    console.error('Room join error:', error);
  }

  // Emit array of currently online users to this socket
  const onlineUsersArray = Array.from(connectedUsers.keys()).map((uid) => ({
    userId: uid,
  }));
  socket.emit('current_online_users', onlineUsersArray);

  // Handle join conversation request with participant check and join room
  socket.on('join_conversation', async (conversationId) => {
    try {
      const { default: Conversation } = await import('../core/models/Conversation.js');
      const conversation = await Conversation.findById(conversationId);
      if (conversation && conversation.hasParticipant(socket.userId)) {
        socket.join(conversationId);
        socket.emit('joined_conversation', { conversationId });
      } else {
        socket.emit('error', {
          message: 'Not authorized to join this conversation',
        });
      }
    } catch {
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });

  // Handle leaving conversation by leaving the room
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
    socket.emit('left_conversation', { conversationId });
  });

  // Sending a new message: create, save, check delivery status, broadcast
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, content, type = 'text' } = data;
      const { default: Conversation } = await import('../core/models/Conversation.js');
      const { default: Message } = await import('../core/models/Message.js');

      const convo = await Conversation.findById(conversationId);
      if (!convo || !convo.hasParticipant(socket.userId)) {
        return socket.emit('error', { message: 'Not authorized' });
      }

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return socket.emit('error', { message: 'Message content required' });
      }

      const message = new Message({
        content: content.trim(),
        sender: socket.userId,
        conversation: conversationId,
        type,
        status: 'sending', // optimistic initial status
      });
      await message.save();
      await message.populate('sender', 'name email avatar');

      // Check if any recipient online for delivery status update
      const recipientIds = convo.participants
        .map((p) => p.user.toString())
        .filter((id) => id !== socket.userId.toString());
      const anyRecipientOnline = recipientIds.some((rid) => connectedUsers.has(rid));
      if (anyRecipientOnline) {
        message.status = 'delivered';
        await message.save();
      } else {
        message.status = 'sent';
        await message.save();
      }

      await convo.updateLastMessage(content, socket.userId);

      io.to(conversationId).emit('new_message', {
        message: message.toObject(),
        conversationId,
      });
    } catch (err) {
      console.error('send_message error', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Mark messages as read by the user in bulk, then broadcast
  socket.on('mark_message_read', async ({ messageIds, conversationId }) => {
    const { default: Message } = await import('../core/models/Message.js');
    if (!Array.isArray(messageIds)) return;
    try {
      await Promise.all(
        messageIds.map(async (messageId) => {
          const message = await Message.findById(messageId);
          if (message) {
            await message.markAsRead(socket.userId);
          }
        })
      );
      io.to(conversationId).emit('message_read', {
        conversationId,
        userId: socket.userId,
      });
    } catch (err) {
      console.error('mark_message_read error', err);
      socket.emit('error', { message: 'Failed to mark messages read' });
    }
  });

  // Typing indicator start broadcast with sender profile info
  socket.on('typing_start', ({ conversationId }) => {
    if (!conversationId) return;
    socket.to(conversationId).emit('user_typing', {
      userId: socket.userId,
      // Send minimal public profile info for typing indicator UI
      user: {
        _id: socket.userId,
        name: socket.user?.name || 'Unknown',
        avatar: socket.user?.avatar || null,
      },
      conversationId,
    });
  });

  // Typing indicator stop broadcast
  socket.on('typing_stop', ({ conversationId }) => {
    if (!conversationId) return;
    socket.to(conversationId).emit('user_stop_typing', {
      userId: socket.userId,
      conversationId,
    });
  });

  // Reaction add event
  socket.on('add_reaction', async ({ messageId, emoji }) => {
    try {
      const { default: Message } = await import('../core/models/Message.js');
      const message = await Message.findById(messageId);
      if (!message) return;
      await message.addReaction(socket.userId, emoji);
      io.to(message.conversation.toString()).emit('reaction_updated', {
        messageId,
        reactions: message.reactions,
      });
    } catch (err) {
      console.error('add_reaction error', err);
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  });

  // Reaction remove event
  socket.on('remove_reaction', async ({ messageId, emoji }) => {
    try {
      const { default: Message } = await import('../core/models/Message.js');
      const message = await Message.findById(messageId);
      if (!message) return;
      await message.removeReaction(socket.userId, emoji);
      io.to(message.conversation.toString()).emit('reaction_updated', {
        messageId,
        reactions: message.reactions,
      });
    } catch (err) {
      console.error('remove_reaction error', err);
      socket.emit('error', { message: 'Failed to remove reaction' });
    }
  });

  // On socket disconnect: remove from tracking, update user offline if last connection
  socket.on('disconnect', async () => {
    const userSockets = connectedUsers.get(socket.userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        connectedUsers.delete(socket.userId);
        await User.findByIdAndUpdate(socket.userId, {
          status: 'offline',
          lastSeen: new Date(),
        });
        socket.broadcast.emit('user_offline', {
          userId: socket.userId,
          lastSeen: new Date().toISOString(),
        });
      } else {
        connectedUsers.set(socket.userId, userSockets);
      }
    }
  });
};

export default { handleConnection };
