/**
 * Authentication Service - OPTIMIZED WITH UTILITIES
 * Enhanced auth calls with validation and error handling
 */
import api, { apiHelpers } from './api';
import { AUTH_ENDPOINTS, USER_ENDPOINTS } from '../utils/constants';
import { validateFormData, authValidation, fileValidation } from '../utils/validation';
import { formatError } from '../utils/formatters';

export const authService = {
  // ENHANCED: Register with validation
  register: async (userData) => {
    const validation = validateFormData(userData, {
      name: authValidation.name,
      email: authValidation.email,
      password: authValidation.password,
      ...(userData.confirmPassword && {
        confirmPassword: authValidation.confirmPassword(userData.password)
      })
    });

    if (!validation.isValid) {
      const error = new Error(Object.values(validation.errors)[0]);
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    try {
      const response = await api.post(AUTH_ENDPOINTS.REGISTER, userData);
      return response.data;
    } catch (error) {
      throw new Error(formatError(error));
    }
  },

  // ENHANCED: Login with validation
  login: async (credentials) => {
    const validation = validateFormData(credentials, {
      email: authValidation.email,
      password: { required: 'Password is required' }
    });

    if (!validation.isValid) {
      const error = new Error(Object.values(validation.errors)[0]);
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    try {
      const response = await api.post(AUTH_ENDPOINTS.LOGIN, credentials);
      return response.data;
    } catch (error) {
      throw new Error(formatError(error));
    }
  },

  // Logout with safe API call
  logout: async () => {
    return apiHelpers.safeApiCall(
      () => api.post(AUTH_ENDPOINTS.LOGOUT),
      { success: true } // Fallback for offline logout
    );
  },

  // ENHANCED: Change password with validation
  changePassword: async (passwordData) => {
    const validation = validateFormData(passwordData, {
      currentPassword: { required: 'Current password is required' },
      newPassword: authValidation.password,
      confirmPassword: authValidation.confirmPassword(passwordData.newPassword)
    });

    if (!validation.isValid) {
      const error = new Error(Object.values(validation.errors)[0]);
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    try {
      const response = await api.put(AUTH_ENDPOINTS.CHANGE_PASSWORD, passwordData);
      return response.data;
    } catch (error) {
      throw new Error(formatError(error));
    }
  },

  // Forgot password with email validation
  forgotPassword: async (email) => {
    const validation = validateFormData({ email }, { email: authValidation.email });
    
    if (!validation.isValid) {
      const error = new Error(validation.errors.email);
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    try {
      const response = await api.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email });
      return response.data;
    } catch (error) {
      throw new Error(formatError(error));
    }
  },

  // Reset password with validation
  resetPassword: async (resetData) => {
    const validation = validateFormData(resetData, {
      password: authValidation.password,
      confirmPassword: authValidation.confirmPassword(resetData.password)
    });

    if (!validation.isValid) {
      const error = new Error(Object.values(validation.errors)[0]);
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    try {
      const response = await api.post(AUTH_ENDPOINTS.RESET_PASSWORD, resetData);
      return response.data;
    } catch (error) {
      throw new Error(formatError(error));
    }
  },

  // Get profile with error handling
  getProfile: async () => {
    try {
      const response = await api.get(USER_ENDPOINTS.PROFILE);
      return response.data;
    } catch (error) {
      throw new Error(formatError(error));
    }
  },

  // ENHANCED: Update profile with validation
  updateProfile: async (profileData) => {
    const validationRules = {};
    
    if (profileData.name) validationRules.name = authValidation.name;
    if (profileData.email) validationRules.email = authValidation.email;
    if (profileData.phone) validationRules.phone = authValidation.phone;
    if (profileData.bio) validationRules.bio = authValidation.bio;
    if (profileData.websiteUrl) validationRules.websiteUrl = authValidation.websiteUrl;

    const validation = validateFormData(profileData, validationRules);

    if (!validation.isValid) {
      const error = new Error(Object.values(validation.errors)[0]);
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    try {
      const response = await api.put(USER_ENDPOINTS.UPDATE_PROFILE, profileData);
      return response.data;
    } catch (error) {
      throw new Error(formatError(error));
    }
  },

  // ENHANCED: Upload avatar with file validation
  uploadAvatar: async (file) => {
    const fileValidationResult = validateFile(file, fileValidation.avatar);
    
    if (!fileValidationResult.isValid) {
      const error = new Error(fileValidationResult.errors.join(', '));
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    try {
      const formData = apiHelpers.createFormData({ avatar: file });
      const response = await api.post(USER_ENDPOINTS.UPLOAD_AVATAR, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw new Error(formatError(error));
    }
  },
};

export default authService;
