import User from '../models/User.js';

/**
 * Retrieve user profile by ID.
 * Throws 404 if user not found.
 * Returns public profile only.
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user.getPublicProfile();
};

/**
 * Update user profile fields.
 * Prevents duplicate email usage.
 * Returns updated public profile.
 */
export const updateUserProfile = async (userId, updateData) => {
  if (updateData.email) {
    const exists = await User.findOne({ email: updateData.email, _id: { $ne: userId } });
    if (exists) {
      const error = new Error('Email already in use');
      error.statusCode = 400;
      throw error;
    }
  }

  const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user.getPublicProfile();
};

/**
 * Search users by name or email (case-insensitive).
 * Excludes current user.
 * Limits results.
 */
export const searchUsers = async (query, excludeUserId, limit = 10) => {
  if (!query || query.length < 2) {
    const error = new Error('Query too short');
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
