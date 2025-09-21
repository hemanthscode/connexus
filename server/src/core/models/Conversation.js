import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['direct', 'group'], required: true, default: 'direct' },
    name: { type: String, maxlength: 100, trim: true },
    description: { type: String, maxlength: 500 },
    participants: [
      {
        user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
        joinedAt: { type: Date, default: Date.now },
        role: { type: String, enum: ['admin', 'moderator', 'member'], default: 'member' },
        lastRead: { type: Date, default: Date.now },
      },
    ],
    lastMessage: {
      content: String,
      sender: { type: mongoose.Schema.ObjectId, ref: 'User' },
      timestamp: { type: Date, default: Date.now },
    },
    avatar: { type: String, default: null },
    settings: {
      allowNewMembers: { type: Boolean, default: true },
      muteNotifications: { type: Boolean, default: false },
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

// Indexes for efficient querying
conversationSchema.index({ 'participants.user': 1 })
conversationSchema.index({ createdAt: -1 })
conversationSchema.index({ 'lastMessage.timestamp': -1 })

// Virtual field for participant count
conversationSchema.virtual('participantCount').get(function () {
  return this.participants.length
})

// Check if a user is participant
conversationSchema.methods.hasParticipant = function (userId) {
  return this.participants.some((p) => p.user.toString() === userId.toString())
}

// Get participant object by userId
conversationSchema.methods.getParticipant = function (userId) {
  return this.participants.find((p) => p.user.toString() === userId.toString())
}

// Update lastMessage field
conversationSchema.methods.updateLastMessage = function (content, senderId) {
  this.lastMessage = { content, sender: senderId, timestamp: new Date() }
  return this.save()
}

// Static method to find all active conversations for a user, populated with needed info
conversationSchema.statics.findUserConversations = function (userId) {
  return this.find({ 'participants.user': userId, isActive: true })
    .populate('participants.user', 'name email avatar status lastSeen')
    .populate('lastMessage.sender', 'name avatar')
    .sort({ 'lastMessage.timestamp': -1 })
}

export default mongoose.model('Conversation', conversationSchema)
