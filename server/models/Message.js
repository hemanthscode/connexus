// connexus-server/models/Message.js
import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    sender: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    conversation: { type: mongoose.Schema.ObjectId, ref: 'Conversation', required: true },
    type: { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text' },
    replyTo: { type: mongoose.Schema.ObjectId, ref: 'Message', default: null },
    attachments: [{ name: String, url: String, size: Number, mimeType: String }],
    reactions: [
      {
        user: { type: mongoose.Schema.ObjectId, ref: 'User' },
        emoji: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    status: { type: String, enum: ['sending', 'sent', 'delivered', 'read', 'failed'], default: 'sent' },
    readBy: [{ user: { type: mongoose.Schema.ObjectId, ref: 'User' }, readAt: { type: Date, default: Date.now } }],
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
)

messageSchema.index({ conversation: 1, createdAt: -1 })
messageSchema.index({ sender: 1 })
messageSchema.index({ createdAt: -1 })

messageSchema.virtual('formattedTimestamp').get(function () {
  return this.createdAt.toISOString()
})

messageSchema.methods.markAsRead = function (userId) {
  const exists = this.readBy.find((r) => r.user.toString() === userId.toString())
  if (!exists) {
    this.readBy.push({ user: userId, readAt: new Date() })
    return this.save()
  }
  return Promise.resolve(this)
}

messageSchema.methods.addReaction = function (userId, emoji) {
  const exists = this.reactions.find((r) => r.user.toString() === userId.toString() && r.emoji === emoji)
  if (!exists) {
    this.reactions.push({ user: userId, emoji, timestamp: new Date() })
    return this.save()
  }
  return Promise.resolve(this)
}

messageSchema.methods.removeReaction = function (userId, emoji) {
  this.reactions = this.reactions.filter(
    (r) => !(r.user.toString() === userId.toString() && r.emoji === emoji)
  )
  return this.save()
}

messageSchema.methods.softDelete = function () {
  this.isDeleted = true
  this.deletedAt = new Date()
  return this.save()
}

messageSchema.statics.findConversationMessages = function (conversationId, page = 1, limit = 50) {
  const skip = (page - 1) * limit
  return this.find({ conversation: conversationId, isDeleted: false })
    .populate('sender', 'name email avatar')
    .populate('replyTo', 'content sender')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
}

export default mongoose.model('Message', messageSchema)
