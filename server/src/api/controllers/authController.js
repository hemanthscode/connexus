import {
  registerUser,
  loginUser,
  changeUserPassword,
  logoutUser,
} from '../services/authService.js';
import { validateRegister, validateLogin, validateChangePassword } from '../validations/authValidation.js';
import { sendSuccess, sendValidationError, sendServiceError } from '../utils/responseHelper.js';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, STATUS_CODES } from '../constants/index.js';

/**
 * Register a new user
 */
export const register = async (req, res) => {
  try {
    const { error } = validateRegister(req.body);
    if (error) return sendValidationError(res, error);

    const { name, email, password } = req.body;
    const tokenResponse = await registerUser({ name, email, password });

    sendSuccess(res, SUCCESS_MESSAGES.USER_REGISTERED, tokenResponse, STATUS_CODES.CREATED);
  } catch (error) {
    sendServiceError(res, error, ERROR_MESSAGES.SERVER_ERROR_REGISTRATION);
  }
};

/**
 * Login user
 */
export const login = async (req, res) => {
  try {
    const { error } = validateLogin(req.body);
    if (error) return sendValidationError(res, error);

    const { email, password } = req.body;
    const tokenResponse = await loginUser({ email, password });

    sendSuccess(res, SUCCESS_MESSAGES.LOGIN_SUCCESSFUL, tokenResponse);
  } catch (error) {
    sendServiceError(res, error, ERROR_MESSAGES.SERVER_ERROR_LOGIN);
  }
};

/**
 * Change authenticated user's password
 */
export const changePassword = async (req, res) => {
  try {
    const { error } = validateChangePassword(req.body);
    if (error) return sendValidationError(res, error);

    const { currentPassword, newPassword } = req.body;
    await changeUserPassword(req.user._id, currentPassword, newPassword);

    sendSuccess(res, SUCCESS_MESSAGES.PASSWORD_CHANGED);
  } catch (error) {
    sendServiceError(res, error, ERROR_MESSAGES.SERVER_ERROR_PASSWORD);
  }
};

/**
 * Logout authenticated user
 */
export const logout = async (req, res) => {
  try {
    await logoutUser(req.user._id);
    sendSuccess(res, SUCCESS_MESSAGES.LOGGED_OUT);
  } catch (error) {
    sendServiceError(res, error, ERROR_MESSAGES.SERVER_ERROR_LOGOUT);
  }
};

export default {
  register,
  login,
  changePassword,
  logout,
};
