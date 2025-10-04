/**
 * Authentication Service
 * Handles all auth-related API calls
 */

import api, { apiHelpers } from './api';
import { AUTH_ENDPOINTS, USER_ENDPOINTS } from '../utils/constants';

export const authService = {
  // User registration
  register: async (userData) => {
    const response = await api.post(AUTH_ENDPOINTS.REGISTER, userData);
    return response.data;
  },

  // User login
  login: async (credentials) => {
    const response = await api.post(AUTH_ENDPOINTS.LOGIN, credentials);
    return response.data;
  },

  // User logout
  logout: async () => {
    try {
      const response = await api.post(AUTH_ENDPOINTS.LOGOUT);
      return response.data;
    } catch (error) {
      // Even if logout fails on server, we should clear local storage
      console.warn('Logout API failed, clearing local storage anyway');
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.put(AUTH_ENDPOINTS.CHANGE_PASSWORD, passwordData);
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (resetData) => {
    const response = await api.post(AUTH_ENDPOINTS.RESET_PASSWORD, resetData);
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get(USER_ENDPOINTS.PROFILE);
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put(USER_ENDPOINTS.UPDATE_PROFILE, profileData);
    return response.data;
  },

  // Upload avatar
  uploadAvatar: async (file) => {
    const formData = apiHelpers.createFormData({ avatar: file });
    const response = await api.post(USER_ENDPOINTS.UPLOAD_AVATAR, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default authService;
