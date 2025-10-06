import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Helper function to validate URL format
const validateURL = (url) => {
  if (!url) return true; // Allow empty URLs
  try {
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    return urlPattern.test(url);
  } catch (error) {
    return false;
  }
};

// Helper function to validate phone number
const validatePhone = (phone) => {
  if (!phone) return true; // Allow empty phone numbers
  // Supports formats: +1234567890, 123-456-7890, (123) 456-7890, 1234567890
  const phonePattern = /^(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}$/;
  return phonePattern.test(phone);
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 50,
      trim: true,
      description: 'Full name of the user',
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
      description: "User's email address",
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 6,
      description: 'Hashed password',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      validate: [validatePhone, 'Please provide a valid phone number'],
      maxlength: 20,
      description: "User's phone number",
    },
    avatar: {
      type: String,
      default: null,
      description: "URL to user's avatar image",
    },
    status: {
      type: String,
      enum: ['online', 'away', 'offline'],
      default: 'offline',
      description: "User's current online/offline status",
    },
    lastSeen: {
      type: Date,
      default: Date.now,
      description: 'Timestamp of last activity',
    },
    bio: {
      type: String,
      maxlength: 250,
      trim: true,
      default: '',
      description: 'Short user biography or status message',
    },
    location: {
      type: String,
      maxlength: 100,
      trim: true,
      default: '',
      description: 'User location (city, country)',
    },
    socialLinks: {
      type: Map,
      of: {
        type: String,
        validate: [validateURL, 'Please provide a valid URL'],
        maxlength: 255,
      },
      default: {},
      description: "User's social profile URLs (key: platform, value: URL)",
    },
    isActive: {
      type: Boolean,
      default: true,
      description: 'If user account is active',
    },
    contactsCount: {
      type: Number,
      default: 0,
      description: "Count of user's unique contacts",
    },
    blockedUsers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
      description: 'List of blocked user IDs',
    },
  },
  { timestamps: true }
);

// Password hashing middleware before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Check password match
userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Return public user profile for frontend (exclude sensitive data)
userSchema.methods.getPublicProfile = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  
  // Convert Map to plain object for JSON serialization
  if (user.socialLinks && user.socialLinks instanceof Map) {
    const socialLinksObj = {};
    user.socialLinks.forEach((value, key) => {
      socialLinksObj[key] = value;
    });
    user.socialLinks = socialLinksObj;
  }
  
  return user;
};

// Update lastSeen timestamp
userSchema.methods.updateLastSeen = function () {
  this.lastSeen = new Date();
  return this.save({ validateBeforeSave: false });
};

// Block user
userSchema.methods.blockUser = function (userId) {
  if (!this.blockedUsers.includes(userId)) {
    this.blockedUsers.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Unblock user
userSchema.methods.unblockUser = function (userId) {
  this.blockedUsers = this.blockedUsers.filter(
    (id) => id.toString() !== userId.toString()
  );
  return this.save();
};

// Helper method to update social links
userSchema.methods.updateSocialLinks = function (socialLinksData) {
  if (!this.socialLinks) {
    this.socialLinks = new Map();
  }
  
  // Clear existing social links
  this.socialLinks.clear();
  
  // Add new social links
  if (socialLinksData && typeof socialLinksData === 'object') {
    Object.entries(socialLinksData).forEach(([platform, url]) => {
      if (url && typeof url === 'string' && url.trim()) {
        this.socialLinks.set(platform.trim(), url.trim());
      }
    });
  }
  
  return this.save();
};

export default mongoose.model('User', userSchema);
