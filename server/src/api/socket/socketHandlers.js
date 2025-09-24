import User from '../models/User.js';

const connectedUsers = new Map();

/**
 * Handle socket connections and events for chat.
 */
export const handleConnection = (io) => async (socket) => {
  const userSockets = connectedUsers.get(socket.userId) || new Set();
  userSockets.add(socket.id);
  connectedUsers.set(socket.userId, userSockets);

  if (userSockets.size === 1) {
    await User.findByIdAndUpdate(socket.userId, { status: 'online', lastSeen: new Date() });
    socket.broadcast.emit('user_online', { userId: socket.userId, lastSeen: null });
  }

  try {
    const { default: Conversation } = await import('../models/Conversation.js');
    const conversations = await Conversation.find({ 'participants.user': socket.userId });
    conversations.forEach((c) => {
      socket.join(c._id.toString());
    });
  } catch (error) {
    console.error('Room join error:', error);
  }

  const onlineUsersArray = Array.from(connectedUsers.keys()).map((uid) => ({ userId: uid }));
  socket.emit('current_online_users', onlineUsersArray);

  socket.on('join_conversation', async (conversationId) => {
    try {
      const { default: Conversation } = await import('../models/Conversation.js');
      const conversation = await Conversation.findById(conversationId);
      if (conversation && conversation.hasParticipant(socket.userId)) {
        socket.join(conversationId);
        socket.emit('joined_conversation', { conversationId });
      } else {
        socket.emit('error', { message: 'Not authorized to join this conversation' });
      }
    } catch {
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
    socket.emit('left_conversation', { conversationId });
  });

  socket.on('send_message', async (data) => {
    try {
      const { conversationId, content, type = 'text', replyTo = null, attachments = [] } = data;
      const { default: Conversation } = await import('../models/Conversation.js');
      const { default: Message } = await import('../models/Message.js');

      const convo = await Conversation.findById(conversationId);
      if (!convo || !convo.hasParticipant(socket.userId) || convo.settings.archived) {
        return socket.emit('error', { message: 'Not authorized or conversation archived' });
      }

      if (convo.type === 'direct') {
        const otherParticipantId = convo.participants.find(p => p.user.toString() !== socket.userId.toString())?.user;
        if (otherParticipantId) {
          const otherUser = await User.findById(otherParticipantId);
          if (otherUser && otherUser.blockedUsers.includes(socket.userId)) {
            return socket.emit('error', { message: 'You are blocked by the recipient' });
          }
        }
      }

      const message = new Message({
        content: content.trim(),
        sender: socket.userId,
        conversation: conversationId,
        type,
        replyTo,
        attachments,
        status: 'sending',
      });
      await message.save();
      await message.populate('sender', 'name email avatar');

      const recipientIds = convo.participants
        .map((p) => p.user.toString())
        .filter((id) => id !== socket.userId.toString());
      const anyRecipientOnline = recipientIds.some((rid) => connectedUsers.has(rid));
      message.status = anyRecipientOnline ? 'delivered' : 'sent';
      await message.save();

      await convo.updateLastMessage(content.trim(), socket.userId);

      io.to(conversationId).emit('new_message', { message: message.toObject(), conversationId });
    } catch (err) {
      console.error('send_message error', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('mark_message_read', async ({ messageIds, conversationId }) => {
    if (!Array.isArray(messageIds)) return;
    try {
      const { default: Message } = await import('../models/Message.js');
      await Promise.all(
        messageIds.map(async (messageId) => {
          const message = await Message.findById(messageId);
          if (message) await message.markAsRead(socket.userId);
        })
      );
      io.to(conversationId).emit('message_read', { conversationId, userId: socket.userId });
    } catch (err) {
      console.error('mark_message_read error', err);
      socket.emit('error', { message: 'Failed to mark messages read' });
    }
  });

  socket.on('typing_start', ({ conversationId }) => {
    if (!conversationId) return;
    socket.to(conversationId).emit('user_typing', {
      userId: socket.userId,
      user: { 
        _id: socket.userId, 
        name: socket.user?.name || 'Unknown', 
        avatar: socket.user?.avatar || null 
      },
      conversationId,
    });
  });

  socket.on('typing_stop', ({ conversationId }) => {
    if (!conversationId) return;
    socket.to(conversationId).emit('user_stop_typing', { 
      userId: socket.userId, 
      conversationId 
    });
  });

  socket.on('add_reaction', async ({ messageId, emoji }) => {
    try {
      const { default: Message } = await import('../models/Message.js');
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

  socket.on('remove_reaction', async ({ messageId, emoji }) => {
    try {
      const { default: Message } = await import('../models/Message.js');
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

  socket.on('edit_message', async ({ messageId, newContent }) => {
    try {
      const { default: Message } = await import('../models/Message.js');
      const message = await Message.findById(messageId);
      
      if (!message) {
        return socket.emit('error', { message: 'Message not found' });
      }
      
      if (message.sender.toString() !== socket.userId.toString()) {
        return socket.emit('error', { message: 'Unauthorized to edit message' });
      }
      
      await message.editContent(newContent.trim());
      io.to(message.conversation.toString()).emit('message_edited', {
        messageId,
        newContent: newContent.trim(),
        editedAt: message.editedAt,
      });
    } catch (err) {
      console.error('edit_message error', err);
      socket.emit('error', { message: 'Failed to edit message' });
    }
  });

  socket.on('delete_message', async ({ messageId }) => {
    try {
      const { default: Message } = await import('../models/Message.js');
      const { default: Conversation } = await import('../models/Conversation.js');
      
      const message = await Message.findById(messageId);
      if (!message) {
        return socket.emit('error', { message: 'Message not found' });
      }
      
      const convo = await Conversation.findById(message.conversation);
      if (!convo) {
        return socket.emit('error', { message: 'Conversation not found' });
      }
      
      const isSender = message.sender.toString() === socket.userId.toString();
      const participant = convo.getParticipant(socket.userId);
      const isAdmin = participant?.role === 'admin';
      
      if (!isSender && !isAdmin) {
        return socket.emit('error', { message: 'Unauthorized to delete message' });
      }
      
      await message.softDelete();
      io.to(message.conversation.toString()).emit('message_deleted', {
        messageId,
        deletedAt: message.deletedAt,
      });
    } catch (err) {
      console.error('delete_message error', err);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  });

  socket.on('join_group', async ({ groupId }) => {
    try {
      const { default: Conversation } = await import('../models/Conversation.js');
      const group = await Conversation.findById(groupId);
      
      if (!group || group.type !== 'group') {
        return socket.emit('error', { message: 'Group not found' });
      }
      
      if (!group.hasParticipant(socket.userId)) {
        return socket.emit('error', { message: 'Not a member of this group' });
      }
      
      socket.join(groupId);
      socket.to(groupId).emit('user_joined_group', {
        userId: socket.userId,
        user: {
          _id: socket.userId,
          name: socket.user?.name || 'Unknown',
          avatar: socket.user?.avatar || null
        },
        groupId,
      });
    } catch (err) {
      console.error('join_group error', err);
      socket.emit('error', { message: 'Failed to join group' });
    }
  });

  socket.on('leave_group', async ({ groupId }) => {
    try {
      socket.leave(groupId);
      socket.to(groupId).emit('user_left_group', {
        userId: socket.userId,
        groupId,
      });
    } catch (err) {
      console.error('leave_group error', err);
      socket.emit('error', { message: 'Failed to leave group' });
    }
  });

  socket.on('update_user_status', async ({ status }) => {
    try {
      if (!['online', 'away', 'offline'].includes(status)) {
        return socket.emit('error', { message: 'Invalid status' });
      }
      
      await User.findByIdAndUpdate(socket.userId, { status, lastSeen: new Date() });
      socket.broadcast.emit('user_status_updated', {
        userId: socket.userId,
        status,
        lastSeen: new Date().toISOString(),
      });
    } catch (err) {
      console.error('update_user_status error', err);
      socket.emit('error', { message: 'Failed to update status' });
    }
  });

  socket.on('request_conversation_info', async ({ conversationId }) => {
    try {
      const { default: Conversation } = await import('../models/Conversation.js');
      const conversation = await Conversation.findById(conversationId)
        .populate('participants.user', 'name email avatar status lastSeen')
        .populate('lastMessage.sender', 'name avatar');
        
      if (!conversation) {
        return socket.emit('error', { message: 'Conversation not found' });
      }
      
      if (!conversation.hasParticipant(socket.userId)) {
        return socket.emit('error', { message: 'Unauthorized access to conversation' });
      }
      
      socket.emit('conversation_info', {
        conversationId,
        conversation: conversation.toObject(),
      });
    } catch (err) {
      console.error('request_conversation_info error', err);
      socket.emit('error', { message: 'Failed to get conversation info' });
    }
  });

  socket.on('ping', () => {
    socket.emit('pong');
  });

  socket.on('disconnect', async (reason) => {
    console.log(`User ${socket.userId} disconnected: ${reason}`);
    
    const userSockets = connectedUsers.get(socket.userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      
      if (userSockets.size === 0) {
        connectedUsers.delete(socket.userId);
        await User.findByIdAndUpdate(socket.userId, { 
          status: 'offline', 
          lastSeen: new Date() 
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

  socket.on('error', (error) => {
    console.error('Socket error for user', socket.userId, ':', error);
  });
};

/**
 * Get currently connected users count
 */
export const getConnectedUsersCount = () => {
  return connectedUsers.size;
};

/**
 * Get connected users list
 */
export const getConnectedUsers = () => {
  return Array.from(connectedUsers.keys());
};

/**
 * Check if user is online
 */
export const isUserOnline = (userId) => {
  return connectedUsers.has(userId.toString());
};

export default { 
  handleConnection, 
  getConnectedUsersCount, 
  getConnectedUsers, 
  isUserOnline 
};
