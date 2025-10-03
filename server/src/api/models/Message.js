import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    name: { type: String, description: "Attachment file name" },
    url: { type: String, description: "Attachment URL" },
    size: { type: Number, description: "File size in bytes" },
    mimeType: { type: String, description: "File MIME type" },
  },
  { _id: false }
);

// FIXED: Enhanced reaction schema with proper user reference
const reactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const readBySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
      description: 'Message content',
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      description: 'Message sender',
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      description: 'Associated conversation',
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text',
      description: 'Message type',
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
      description: 'Message this is replying to',
    },
    attachments: [attachmentSchema],
    reactions: [reactionSchema],
    status: {
      type: String,
      enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
      default: 'sent',
      description: 'Delivery status',
    },
    readBy: [readBySchema],
    editedAt: { type: Date, default: null, description: 'Edit timestamp' },
    deletedAt: { type: Date, default: null, description: 'Soft delete timestamp' },
    isDeleted: { type: Boolean, default: false, description: 'Soft delete flag' },
  },
  { timestamps: true }
);

// Indexes for efficient querying
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ createdAt: -1 });

// Virtual for ISO timestamp format
messageSchema.virtual('formattedTimestamp').get(function () {
  return this.createdAt.toISOString();
});

// Mark message as read by user, updating readBy array and status accordingly
messageSchema.methods.markAsRead = async function (userId) {
  const uidStr = userId.toString();
  const uidObj = new mongoose.Types.ObjectId(uidStr);

  const existing = this.readBy.find((r) => r.user.toString() === uidStr);
  if (existing) {
    existing.readAt = new Date();
  } else {
    this.readBy.push({ user: uidObj, readAt: new Date() });
  }

  const Conversation = mongoose.model('Conversation');
  const convo = await Conversation.findById(this.conversation).select('participants.user').lean();
  const requiredReads = convo ? Math.max(0, convo.participants.length - 1) : 0;
  const uniqueReaders = new Set(this.readBy.map((r) => r.user.toString())).size;

  if (requiredReads > 0 && uniqueReaders >= requiredReads) {
    this.status = 'read';
  } else if (uniqueReaders > 0 && this.status === 'sent') {
    this.status = 'delivered';
  }

  return this.save();
};

// FIXED: Enhanced addReaction method with user population
messageSchema.methods.addReaction = async function (userId, emoji) {
  const exists = this.reactions.find(
    (r) => r.user.toString() === userId.toString() && r.emoji === emoji
  );
  if (!exists) {
    this.reactions.push({ user: userId, emoji, timestamp: new Date() });
    await this.save();
    // FIXED: Populate the new reaction user details
    await this.populate('reactions.user', 'name email avatar');
  }
  return this;
};

// FIXED: Enhanced removeReaction method with user population
messageSchema.methods.removeReaction = async function (userId, emoji) {
  this.reactions = this.reactions.filter(
    (r) => !(r.user.toString() === userId.toString() && r.emoji === emoji)
  );
  await this.save();
  // FIXED: Populate remaining reaction user details
  await this.populate('reactions.user', 'name email avatar');
  return this;
};

// Soft delete message
messageSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Edit message content
messageSchema.methods.editContent = function (newContent) {
  this.content = newContent;
  this.editedAt = new Date();
  return this.save();
};

// FIXED: Enhanced static method to find messages with populated reactions
messageSchema.statics.findConversationMessages = function (conversationId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  return this.find({ conversation: conversationId, isDeleted: false })
    .populate('sender', 'name email avatar')
    .populate('replyTo', 'content sender')
    .populate('reactions.user', 'name email avatar') // FIXED: Populate reaction users
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

export default mongoose.model('Message', messageSchema);
