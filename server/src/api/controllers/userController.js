import { getUserProfile, updateUserProfile, searchUsers } from '../services/userService.js';
import { validateUpdateProfile } from '../validations/userValidation.js';
import { sendSuccess, sendError, sendValidationError, sendServiceError } from '../utils/responseHelper.js';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, STATUS_CODES } from '../constants/index.js';

/**
 * Get authenticated user's own profile
 */
export const getMe = async (req, res) => {
  try {
    const profile = await getUserProfile(req.user._id);
    sendSuccess(res, 'Profile retrieved', profile);
  } catch (error) {
    sendServiceError(res, error, ERROR_MESSAGES.PROFILE_RETRIEVAL_ERROR);
  }
};

/**
 * Get user profile by ID
 */
export const getProfile = async (req, res) => {
  try {
    const profile = await getUserProfile(req.params.userId);
    sendSuccess(res, 'Profile retrieved', profile);
  } catch (error) {
    sendServiceError(res, error, ERROR_MESSAGES.PROFILE_RETRIEVAL_ERROR);
  }
};

/**
 * Update authenticated user's profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { error } = validateUpdateProfile(req.body);
    if (error) return sendValidationError(res, error);

    const allowedFields = ['name', 'email', 'status', 'avatar', 'bio', 'location', 'phone', 'socialLinks'];
    const updateData = {};
    
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'socialLinks') {
          updateData[field] = new Map();
          if (typeof req.body[field] === 'object' && req.body[field] !== null) {
            Object.entries(req.body[field]).forEach(([platform, url]) => {
              if (url && typeof url === 'string' && url.trim()) {
                updateData[field].set(platform.trim(), url.trim());
              }
            });
          }
        } else {
          updateData[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
        }
      }
    });

    const updatedProfile = await updateUserProfile(req.user._id, updateData);
    sendSuccess(res, SUCCESS_MESSAGES.PROFILE_UPDATED, updatedProfile);
  } catch (error) {
    sendServiceError(res, error, ERROR_MESSAGES.PROFILE_UPDATE_ERROR);
  }
};

/**
 * Search users
 */
export const searchUsersController = async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;
    const users = await searchUsers(query, req.user._id, parseInt(limit));
    sendSuccess(res, 'Users found', users);
  } catch (error) {
    if (error.statusCode === STATUS_CODES.BAD_REQUEST) {
      return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
    sendServiceError(res, error, ERROR_MESSAGES.SEARCH_FAILED);
  }
};

export default {
  getMe,
  getProfile,
  updateProfile,
  searchUsersController,
};
