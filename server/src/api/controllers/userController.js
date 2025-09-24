import { getUserProfile, updateUserProfile, searchUsers } from '../services/userService.js';
import { validateUpdateProfile } from '../validations/userValidation.js';

/**
 * Get authenticated user's own profile
 */
export const getMe = async (req, res) => {
  try {
    const profile = await getUserProfile(req.user._id);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error(error);
    if (error.statusCode === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Server error retrieving profile' });
  }
};

/**
 * Get user profile by ID
 */
export const getProfile = async (req, res) => {
  try {
    const profile = await getUserProfile(req.params.userId);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error(error);
    if (error.statusCode === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Server error retrieving profile' });
  }
};

/**
 * Update authenticated user's profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { error } = validateUpdateProfile(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const allowedFields = ['name', 'email', 'status', 'avatar', 'bio', 'location', 'socialLinks'];
    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
      }
    });

    const updatedProfile = await updateUserProfile(req.user._id, updateData);
    res.status(200).json({ success: true, message: 'Profile updated', data: updatedProfile });
  } catch (error) {
    console.error(error);
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};

/**
 * Search users
 */
export const searchUsersController = async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;
    const users = await searchUsers(query, req.user._id, parseInt(limit));
    res.json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Search failed' });
  }
};

export default {
  getMe,
  getProfile,
  updateProfile,
  searchUsersController,
};
