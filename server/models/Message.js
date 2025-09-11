import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Message sender is required']
  },
  conversation: {
    type: mongoose.Schema.ObjectId,
    ref: 'Conversation',
    required: [true, 'Message conversation is required']
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  replyTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'Message',
    default: null
  },
  attachments: [{
    name: String,
    url: String,
    size: Number,
    mimeType: String
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    emoji: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  readBy: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  editedAt: {
    type: Date,
    default: null
  },
  deletedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes for better performance
messageSchema.index({ conversation: 1, createdAt: -1 })
messageSchema.index({ sender: 1 })
messageSchema.index({ createdAt: -1 })

// Virtual for formatted timestamp
messageSchema.virtual('formattedTimestamp').get(function() {
  return this.createdAt.toISOString()
})

// Instance method to mark as read by user
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(r => r.user.toString() === userId.toString())
  
  if (!existingRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    })
    return this.save()
  }
  return Promise.resolve(this)
}

// Instance method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  const existingReaction = this.reactions.find(r => 
    r.user.toString() === userId.toString() && r.emoji === emoji
  )
  
  if (!existingReaction) {
    this.reactions.push({
      user: userId,
      emoji: emoji,
      timestamp: new Date()
    })
    return this.save()
  }
  return Promise.resolve(this)
}

// Instance method to remove reaction
messageSchema.methods.removeReaction = function(userId, emoji) {
  this.reactions = this.reactions.filter(r => 
    !(r.user.toString() === userId.toString() && r.emoji === emoji)
  )
  return this.save()
}

// Instance method to soft delete
messageSchema.methods.softDelete = function() {
  this.isDeleted = true
  this.deletedAt = new Date()
  return this.save()
}

// Static method to find conversation messages
messageSchema.statics.findConversationMessages = function(conversationId, page = 1, limit = 50) {
  const skip = (page - 1) * limit
  
  return this.find({
    conversation: conversationId,
    isDeleted: false
  }).populate('sender', 'name email avatar')
    .populate('replyTo', 'content sender')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
}

export default mongoose.model('Message', messageSchema)
