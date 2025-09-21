import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import User from '../models/User.js'

export const getUserConversations = async (userId) => {
  const conversations = await Conversation.findUserConversations(userId)

  const conversationsWithUnread = await Promise.all(
    conversations.map(async (conv) => {
      const participant = conv.getParticipant(userId)
      if (!participant) return { ...conv.toObject(), unreadCount: 0 }
      const unreadCount = await Message.countDocuments({
        conversation: conv._id,
        createdAt: { $gt: participant.lastRead },
        sender: { $ne: userId },
      })
      return { ...conv.toObject(), unreadCount }
    })
  )

  return conversationsWithUnread
}

export const getConversationMessages = async (conversationId, userId, { page = 1, limit = 50 }) => {
  const conversation = await Conversation.findById(conversationId)
  if (!conversation || !conversation.hasParticipant(userId)) {
    const error = new Error('Unauthorized')
    error.statusCode = 403
    throw error
  }

  const messages = await Message.findConversationMessages(conversationId, page, limit)
  return messages.reverse() // oldest first
}

export const sendMessageInConversation = async (conversationId, userId, content, type = 'text') => {
  const conversation = await Conversation.findById(conversationId)
  if (!conversation || !conversation.hasParticipant(userId)) {
    const error = new Error('Unauthorized')
    error.statusCode = 403
    throw error
  }

  const message = new Message({
    content,
    sender: userId,
    conversation: conversationId,
    type,
  })
  await message.save()
  await message.populate('sender', 'name avatar')

  await conversation.updateLastMessage(content, userId)

  return message
}

export const markConversationAsRead = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId)
  if (!conversation || !conversation.hasParticipant(userId)) {
    const error = new Error('Unauthorized')
    error.statusCode = 403
    throw error
  }

  const participant = conversation.participants.find((p) => p.user.toString() === userId.toString())
  if (participant) {
    participant.lastRead = new Date()
    await conversation.save()
  }

  await Message.updateMany(
    { conversation: conversation._id, sender: { $ne: userId } },
    { $addToSet: { readBy: { user: userId, readAt: new Date() } } }
  )
}

export const createOrGetDirectConversation = async (userId, participantId) => {
  const participant = await User.findById(participantId)
  if (!participant) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }
  const existing = await Conversation.findOne({
    type: 'direct',
    'participants.user': { $all: [userId, participantId] },
  }).populate('participants.user', 'name email avatar')

  if (existing) return existing

  const convo = new Conversation({
    type: 'direct',
    participants: [{ user: userId }, { user: participantId }],
    createdBy: userId,
  })
  await convo.save()
  await convo.populate('participants.user', 'name email avatar')

  return convo
}

export const searchActiveUsers = async (query, userId) => {
  if (!query || query.length < 2) {
    const error = new Error('Query too short')
    error.statusCode = 400
    throw error
  }

  const users = await User.find({
    _id: { $ne: userId },
    isActive: true,
    $or: [{ name: { $regex: query, $options: 'i' } }, { email: { $regex: query, $options: 'i' } }],
  })
    .select('name email avatar status')
    .limit(10)

  return users
}
