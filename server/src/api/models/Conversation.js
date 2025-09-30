import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member',
      description: 'Participant role in the group',
    },
    lastRead: { type: Date, default: Date.now, description: 'Last read message timestamp' },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['direct', 'group'],
      required: true,
      default: 'direct',
      description: 'Type of conversation',
    },
    name: {
      type: String,
      maxlength: 100,
      trim: true,
      default: '',
      description: 'Group chat name',
    },
    description: {
      type: String,
      maxlength: 500,
      default: '',
      description: 'Group chat description',
    },
    participants: [participantSchema],
    lastMessage: {
      content: { type: String, default: '' },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date, default: Date.now },
    },
    avatar: {
      type: String,
      default: null,
      description: 'Optional avatar for group conversation',
    },
    settings: {
      allowNewMembers: { type: Boolean, default: true },
      muteNotifications: { type: Boolean, default: false },
      archived: { type: Boolean, default: false },
    },
    isActive: {
      type: Boolean,
      default: true,
      description: 'Whether conversation is active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      description: 'User who created conversation',
    },
  },
  { timestamps: true }
);

// Indexes for querying performance
conversationSchema.index({ 'participants.user': 1 });
conversationSchema.index({ createdAt: -1 });
conversationSchema.index({ 'lastMessage.timestamp': -1 });

// Virtual to get participant count
conversationSchema.virtual('participantCount').get(function () {
  return this.participants.length;
});

// FIXED: Check if user is a participant with better ObjectId handling
conversationSchema.methods.hasParticipant = function (userId) {
  if (!userId) return false;
  
  const userIdString = userId.toString();
  return this.participants.some((p) => {
    // Handle both populated and non-populated participants
    const participantId = p.user._id || p.user;
    return participantId.toString() === userIdString;
  });
};

// Get participant object by userId
conversationSchema.methods.getParticipant = function (userId) {
  if (!userId) return null;
  
  const userIdString = userId.toString();
  return this.participants.find((p) => {
    const participantId = p.user._id || p.user;
    return participantId.toString() === userIdString;
  });
};

// Add participant if allowed and not present
conversationSchema.methods.addParticipant = function (userId, role = 'member') {
  if (this.hasParticipant(userId)) return false;
  if (!this.settings.allowNewMembers) throw new Error('Adding new members not allowed');
  this.participants.push({ user: userId, role });
  return this.save();
};

// Remove participant
conversationSchema.methods.removeParticipant = function (userId) {
  const userIdString = userId.toString();
  const index = this.participants.findIndex((p) => {
    const participantId = p.user._id || p.user;
    return participantId.toString() === userIdString;
  });
  
  if (index >= 0) {
    this.participants.splice(index, 1);
    return this.save();
  }
  return Promise.resolve(this);
};

// Change role of participant
conversationSchema.methods.changeParticipantRole = function (userId, newRole) {
  const p = this.getParticipant(userId);
  if (!p) throw new Error('Participant not found');
  if (!['admin', 'moderator', 'member'].includes(newRole)) throw new Error('Invalid role');
  p.role = newRole;
  return this.save();
};

// Update lastMessage info
conversationSchema.methods.updateLastMessage = function (content, senderId) {
  this.lastMessage = { content, sender: senderId, timestamp: new Date() };
  return this.save();
};

// Static method to find user's active conversations with detailed user info
conversationSchema.statics.findUserConversations = function (userId) {
  return this.find({ 
    'participants.user': userId, 
    isActive: true, 
    'settings.archived': false 
  })
    .populate('participants.user', 'name email avatar status lastSeen')
    .populate('lastMessage.sender', 'name avatar')
    .sort({ 'lastMessage.timestamp': -1 });
};

export default mongoose.model('Conversation', conversationSchema);
