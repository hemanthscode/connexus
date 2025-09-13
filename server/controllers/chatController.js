import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import User from '../models/User.js'

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.findUserConversations(req.user._id)
    const conversationsWithUnread = await Promise.all(
      conversations.map(async conv => {
        const participant = conv.getParticipant(req.user._id)
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          createdAt: { $gt: participant?.lastRead || 0 },
          sender: { $ne: req.user._id }
        })
        return { ...conv.toObject(), unreadCount }
      })
    )
    res.json({ success: true, data: conversationsWithUnread })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Fetching conversations failed' })
  }
}

export const getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
    if (!conversation || !conversation.hasParticipant(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' })
    }
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 50
    const messages = await Message.findConversationMessages(conversation._id, page, limit)
    res.json({ success: true, data: messages.reverse() })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Fetching messages failed' })
  }
}

export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type = 'text' } = req.body
    const conversation = await Conversation.findById(conversationId)
    if (!conversation || !conversation.hasParticipant(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' })
    }
    const message = new Message({
      content,
      sender: req.user._id,
      conversation: conversationId,
      type
    })
    await message.save()
    await message.populate('sender', 'name avatar')
    await conversation.updateLastMessage(content, req.user._id)
    res.status(201).json({ success: true, message: 'Message sent', data: message })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Sending message failed' })
  }
}

export const markAsRead = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
    if (!conversation || !conversation.hasParticipant(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' })
    }
    const participant = conversation.participants.find(p => p.user.toString() === req.user._id.toString())
    if (participant) {
      participant.lastRead = new Date()
      await conversation.save()
    }
    await Message.updateMany(
      { conversation: conversation._id, sender: { $ne: req.user._id } },
      { $addToSet: { readBy: { user: req.user._id, readAt: new Date() } } }
    )
    res.json({ success: true, message: 'Marked as read' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Mark as read failed' })
  }
}

export const createDirectConversation = async (req, res) => {
  try {
    const participant = await User.findById(req.body.participantId)
    if (!participant) return res.status(404).json({ success: false, message: 'User not found' })

    const existing = await Conversation.findOne({
      type: 'direct',
      'participants.user': { $all: [req.user._id, participant._id] }
    }).populate('participants.user', 'name email avatar')

    if (existing) return res.json({ success: true, data: existing })

    const convo = new Conversation({
      type: 'direct',
      participants: [{ user: req.user._id }, { user: participant._id }],
      createdBy: req.user._id
    })
    await convo.save()
    await convo.populate('participants.user', 'name email avatar')
    res.status(201).json({ success: true, data: convo })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Creation failed' })
  }
}

export const searchUsers = async (req, res) => {
  try {
    if (!req.query.q || req.query.q.length < 2)
      return res.status(400).json({ success: false, message: 'Query too short' })

    const users = await User.find({
      _id: { $ne: req.user._id },
      isActive: true,
      $or: [
        { name: { $regex: req.query.q, $options: 'i' } },
        { email: { $regex: req.query.q, $options: 'i' } }
      ]
    }).select('name email avatar status').limit(10)

    res.json({ success: true, data: users })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Search failed' })
  }
}

export default {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  createDirectConversation,
  searchUsers
}
