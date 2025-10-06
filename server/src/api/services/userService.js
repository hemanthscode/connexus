import User from '../models/User.js';
import { ERROR_MESSAGES } from '../constants/index.js';

/**
 * Retrieve user profile by ID.
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }
  return user.getPublicProfile();
};

/**
 * Update user profile fields.
 */
export const updateUserProfile = async (userId, updateData) => {
  if (updateData.email) {
    const exists = await User.findOne({ email: updateData.email, _id: { $ne: userId } });
    if (exists) {
      const error = new Error(ERROR_MESSAGES.EMAIL_IN_USE);
      error.statusCode = 400;
      throw error;
    }
  }

  // Handle socialLinks Map field properly for Mongoose
  if (updateData.socialLinks && updateData.socialLinks instanceof Map) {
    const socialLinksObject = {};
    updateData.socialLinks.forEach((value, key) => {
      socialLinksObject[key] = value;
    });
    updateData.socialLinks = socialLinksObject;
  }

  const user = await User.findByIdAndUpdate(
    userId, 
    updateData, 
    { 
      new: true, 
      runValidators: true,
      overwrite: false,
      upsert: false
    }
  );

  if (!user) {
    const error = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }

  return user.getPublicProfile();
};

/**
 * Search users by name or email (case-insensitive).
 * Used by userController and can be used by chatController when needed
 */
export const searchUsers = async (query, excludeUserId, limit = 10) => {
  if (!query || query.length < 2) {
    const error = new Error(ERROR_MESSAGES.QUERY_TOO_SHORT);
    error.statusCode = 400;
    throw error;
  }

  const regex = new RegExp(query, 'i');
  const users = await User.find({
    _id: { $ne: excludeUserId },
    isActive: true,
    $or: [{ name: regex }, { email: regex }],
  })
    .select('name email avatar status')
    .limit(limit);

  return users;
};

export default {
  getUserProfile,
  updateUserProfile,
  searchUsers,
};
