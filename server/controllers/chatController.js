import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import User from '../models/User.js'

/**
 * @desc    Get user conversations
 * @route   GET /api/chat/conversations
 * @access  Private
 */
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.findUserConversations(req.user._id)
    
    // Add unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const participant = conv.getParticipant(req.user._id)
        const lastRead = participant ? participant.lastRead : new Date(0)
        
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          createdAt: { $gt: lastRead },
          sender: { $ne: req.user._id }
        })
        
        return {
          ...conv.toObject(),
          unreadCount
        }
      })
    )
    
    res.status(200).json({
      success: true,
      data: conversationsWithUnread
    })
  } catch (error) {
    console.error('Get conversations error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error fetching conversations'
    })
  }
}

/**
 * @desc    Get conversation messages
 * @route   GET /api/chat/conversations/:id/messages
 * @access  Private
 */
export const getMessages = async (req, res) => {
  try {
    const { id: conversationId } = req.params
    const { page = 1, limit = 50 } = req.query
    
    // Check if user is participant
    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      })
    }
    
    if (!conversation.hasParticipant(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this conversation'
      })
    }
    
    // Get messages with pagination
    const messages = await Message.findConversationMessages(
      conversationId, 
      parseInt(page), 
      parseInt(limit)
    )
    
    // Reverse to show oldest first
    const sortedMessages = messages.reverse()
    
    res.status(200).json({
      success: true,
      data: sortedMessages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit)
      }
    })
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error fetching messages'
    })
  }
}

/**
 * @desc    Send message
 * @route   POST /api/chat/messages
 * @access  Private
 */
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type = 'text' } = req.body
    
    // Validation
    if (!conversationId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID and content are required'
      })
    }
    
    // Check if conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      })
    }
    
    if (!conversation.hasParticipant(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages to this conversation'
      })
    }
    
    // Create message
    const message = new Message({
      content,
      sender: req.user._id,
      conversation: conversationId,
      type
    })
    
    await message.save()
    
    // Populate sender info
    await message.populate('sender', 'name email avatar')
    
    // Update conversation last message
    await conversation.updateLastMessage(content, req.user._id)
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    })
    
  } catch (error) {
    console.error('Send message error:', error)
    
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(val => val.message).join(', ')
      return res.status(400).json({
        success: false,
        message
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error sending message'
    })
  }
}

/**
 * @desc    Mark conversation as read
 * @route   PUT /api/chat/conversations/:id/read
 * @access  Private
 */
export const markAsRead = async (req, res) => {
  try {
    const { id: conversationId } = req.params
    
    // Find conversation
    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      })
    }
    
    // Check if user is participant
    if (!conversation.hasParticipant(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this conversation'
      })
    }
    
    // Update participant's last read timestamp
    const participant = conversation.participants.find(
      p => p.user.toString() === req.user._id.toString()
    )
    
    if (participant) {
      participant.lastRead = new Date()
      await conversation.save()
    }
    
    // Mark all messages as read by this user
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id }
      },
      {
        $addToSet: {
          readBy: {
            user: req.user._id,
            readAt: new Date()
          }
        }
      }
    )
    
    res.status(200).json({
      success: true,
      message: 'Conversation marked as read'
    })
    
  } catch (error) {
    console.error('Mark as read error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error marking conversation as read'
    })
  }
}

/**
 * @desc    Create or get direct conversation
 * @route   POST /api/chat/conversations/direct
 * @access  Private
 */
export const createDirectConversation = async (req, res) => {
  try {
    const { participantId } = req.body
    
    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: 'Participant ID is required'
      })
    }
    
    // Check if participant exists
    const participant = await User.findById(participantId)
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }
    
    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      type: 'direct',
      'participants.user': { $all: [req.user._id, participantId] }
    }).populate('participants.user', 'name email avatar status')
    
    if (existingConversation) {
      return res.status(200).json({
        success: true,
        message: 'Conversation retrieved',
        data: existingConversation
      })
    }
    
    // Create new conversation
    const conversation = new Conversation({
      type: 'direct',
      participants: [
        { user: req.user._id },
        { user: participantId }
      ],
      createdBy: req.user._id
    })
    
    await conversation.save()
    
    // Populate participants
    await conversation.populate('participants.user', 'name email avatar status')
    
    res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      data: conversation
    })
    
  } catch (error) {
    console.error('Create direct conversation error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error creating conversation'
    })
  }
}

/**
 * @desc    Search users for new conversations
 * @route   GET /api/chat/users/search
 * @access  Private
 */
export const searchUsers = async (req, res) => {
  try {
    const { q: query } = req.query
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      })
    }
    
    const users = await User.find({
      _id: { $ne: req.user._id }, // Exclude current user
      isActive: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('name email avatar status').limit(10)
    
    res.status(200).json({
      success: true,
      data: users
    })
    
  } catch (error) {
    console.error('Search users error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error searching users'
    })
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
