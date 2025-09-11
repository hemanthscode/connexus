import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['direct', 'group'],
    required: true,
    default: 'direct'
  },
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Conversation name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  participants: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    lastRead: {
      type: Date,
      default: Date.now
    }
  }],
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  avatar: {
    type: String,
    default: null
  },
  settings: {
    allowNewMembers: {
      type: Boolean,
      default: true
    },
    muteNotifications: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes for better performance
conversationSchema.index({ 'participants.user': 1 })
conversationSchema.index({ createdAt: -1 })
conversationSchema.index({ 'lastMessage.timestamp': -1 })

// Virtual for participant count
conversationSchema.virtual('participantCount').get(function() {
  return this.participants.length
})

// Instance method to check if user is participant
conversationSchema.methods.hasParticipant = function(userId) {
  return this.participants.some(p => p.user.toString() === userId.toString())
}

// Instance method to get participant
conversationSchema.methods.getParticipant = function(userId) {
  return this.participants.find(p => p.user.toString() === userId.toString())
}

// Instance method to add participant
conversationSchema.methods.addParticipant = function(userId, role = 'member') {
  if (!this.hasParticipant(userId)) {
    this.participants.push({
      user: userId,
      role: role,
      joinedAt: new Date(),
      lastRead: new Date()
    })
  }
  return this.save()
}

// Instance method to remove participant
conversationSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => p.user.toString() !== userId.toString())
  return this.save()
}

// Instance method to update last message
conversationSchema.methods.updateLastMessage = function(messageContent, senderId) {
  this.lastMessage = {
    content: messageContent,
    sender: senderId,
    timestamp: new Date()
  }
  return this.save()
}

// Static method to find user conversations
conversationSchema.statics.findUserConversations = function(userId) {
  return this.find({
    'participants.user': userId,
    isActive: true
  }).populate('participants.user', 'name email avatar status lastSeen')
    .populate('lastMessage.sender', 'name avatar')
    .sort({ 'lastMessage.timestamp': -1 })
}

export default mongoose.model('Conversation', conversationSchema)
