/**
 * Authentication State Management - OPTIMIZED
 * Enhanced with validation and error handling utilities
 */
import { create } from 'zustand';
import { authService } from '../services/auth';
import { STORAGE_KEYS } from '../utils/constants';
import { formatError } from '../utils/formatters';
import { authValidation, validateFormData } from '../utils/validation';
import toast from 'react-hot-toast';

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: localStorage.getItem(STORAGE_KEYS.TOKEN),
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  // ============== Internal Helpers - OPTIMIZED ==============
  _setAuthState: (authData) => {
    const { user = null, token = null, isAuthenticated = false } = authData;
    
    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
    
    set({ user, token, isAuthenticated, isInitialized: true });
  },

  _handleAuthAction: async (action, successMessage, validationSchema = null) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await action();
      
      if (result?.data) {
        const { token, user } = result.data;
        get()._setAuthState({ user, token, isAuthenticated: true });
      }
      
      if (successMessage) toast.success(successMessage);
      return { success: true, data: result?.data };
      
    } catch (error) {
      const message = formatError(error);
      set({ error: message });
      toast.error(message);
      return { success: false, error: message };
      
    } finally {
      set({ isLoading: false });
    }
  },

  // ============== Actions - ENHANCED WITH VALIDATION ==============
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  register: async (userData) => {
    // Validate registration data
    const validation = validateFormData(userData, {
      name: authValidation.name,
      email: authValidation.email,
      password: authValidation.password,
      ...(userData.confirmPassword && {
        confirmPassword: authValidation.confirmPassword(userData.password)
      })
    });

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      toast.error(firstError);
      return { success: false, error: firstError };
    }

    return get()._handleAuthAction(
      () => authService.register(userData),
      'Registration successful!'
    );
  },

  login: async (credentials) => {
    // Validate login credentials
    const validation = validateFormData(credentials, {
      email: authValidation.email,
      password: { required: 'Password is required' }
    });

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      toast.error(firstError);
      return { success: false, error: firstError };
    }

    return get()._handleAuthAction(
      () => authService.login(credentials),
      'Login successful!'
    );
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn('Logout API failed:', error);
    }
    
    get()._setAuthState({});
    toast.success('Logged out successfully');
  },

  checkAuth: async () => {
    const { isInitialized, isLoading } = get();
    if (isInitialized || isLoading) return;

    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      set({ isInitialized: true });
      return;
    }

    set({ isLoading: true });
    
    try {
      const response = await authService.getProfile();
      get()._setAuthState({
        user: response.data,
        token,
        isAuthenticated: true
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      get()._setAuthState({});
    } finally {
      set({ isLoading: false });
    }
  },

  changePassword: async (passwordData) => {
    // Validate password change data
    const validation = validateFormData(passwordData, {
      currentPassword: { required: 'Current password is required' },
      newPassword: authValidation.password,
      confirmPassword: authValidation.confirmPassword(passwordData.newPassword)
    });

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      toast.error(firstError);
      return { success: false, error: firstError };
    }

    return get()._handleAuthAction(
      () => authService.changePassword(passwordData),
      'Password changed successfully!'
    );
  },

  updateProfile: async (profileData) => {
    // Validate profile data
    const validationRules = {};
    
    if (profileData.name) validationRules.name = authValidation.name;
    if (profileData.email) validationRules.email = authValidation.email;
    if (profileData.phone) validationRules.phone = authValidation.phone;
    if (profileData.bio) validationRules.bio = authValidation.bio;
    if (profileData.websiteUrl) validationRules.websiteUrl = authValidation.websiteUrl;

    const validation = validateFormData(profileData, validationRules);

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      toast.error(firstError);
      return { success: false, error: firstError };
    }

    return get()._handleAuthAction(
      () => authService.updateProfile(profileData),
      'Profile updated successfully!'
    );
  },

  // ============== Utility Methods ==============
  isTokenValid: () => {
    const token = get().token;
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  getStoredUser: () => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
