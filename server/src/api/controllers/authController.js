import {
  registerUser,
  loginUser,
  changeUserPassword,
  logoutUser,
} from '../services/authService.js';
import { validateRegister, validateLogin, validateChangePassword } from '../validations/authValidation.js';

/**
 * Register a new user
 */
export const register = async (req, res) => {
  try {
    const { error } = validateRegister(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { name, email, password } = req.body;
    const tokenResponse = await registerUser({ name, email, password });

    res.status(201).json({ success: true, message: 'User registered successfully', data: tokenResponse });
  } catch (error) {
    console.error(error);
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

/**
 * Login user
 */
export const login = async (req, res) => {
  try {
    const { error } = validateLogin(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { email, password } = req.body;
    const tokenResponse = await loginUser({ email, password });

    res.status(200).json({ success: true, message: 'Login successful', data: tokenResponse });
  } catch (error) {
    console.error(error);
    if (error.statusCode === 401) {
      return res.status(401).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

/**
 * Change authenticated user's password
 */
export const changePassword = async (req, res) => {
  try {
    const { error } = validateChangePassword(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { currentPassword, newPassword } = req.body;
    await changeUserPassword(req.user._id, currentPassword, newPassword);

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    if (error.statusCode === 401 || error.statusCode === 404) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Server error changing password' });
  }
};

/**
 * Logout authenticated user
 */
export const logout = async (req, res) => {
  try {
    await logoutUser(req.user._id);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error during logout' });
  }
};

export default {
  register,
  login,
  changePassword,
  logout,
};
