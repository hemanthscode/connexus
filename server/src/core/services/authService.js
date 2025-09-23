import User from '../models/User.js';
import { generateTokenResponse } from '../../utils/generateToken.js';

/**
 * Registers a new user.
 * Throws error if email already exists.
 * Returns token response.
 */
export const registerUser = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
  if (existingUser) {
    const error = new Error('Email already registered');
    error.statusCode = 400;
    throw error;
  }

  const user = new User({ name: name.trim(), email: email.trim().toLowerCase(), password });
  await user.save();

  return generateTokenResponse(user);
};

/**
 * Authenticates user login.
 * Checks email & password, user active status.
 * Updates lastSeen timestamp on success.
 * Returns token response.
 */
export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
  if (!user || !user.isActive) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  await user.updateLastSeen();

  return generateTokenResponse(user);
};

/**
 * Change password for authenticated user.
 * Validates current password, hashes new password.
 */
export const changeUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const match = await user.matchPassword(currentPassword);
  if (!match) {
    const error = new Error('Current password incorrect');
    error.statusCode = 401;
    throw error;
  }

  user.password = newPassword;
  await user.save();
};

/**
 * Logs out user by setting status offline and updating lastSeen.
 */
export const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { status: 'offline', lastSeen: new Date() });
};
