/**
 * Authentication State Management
 * Handles user auth state and operations
 */

import { create } from 'zustand';
import { authService } from '../services/auth';
import { STORAGE_KEYS } from '../utils/constants';
import { formatError } from '../utils/formatters';
import toast from 'react-hot-toast';

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: localStorage.getItem(STORAGE_KEYS.TOKEN),
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  // Internal helpers
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

  _handleAuthAction: async (action, successMessage) => {
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

  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  register: (userData) => 
    get()._handleAuthAction(
      () => authService.register(userData),
      'Registration successful!'
    ),

  login: (credentials) => 
    get()._handleAuthAction(
      () => authService.login(credentials),
      'Login successful!'
    ),

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

  changePassword: (passwordData) =>
    get()._handleAuthAction(
      () => authService.changePassword(passwordData),
      'Password changed successfully!'
    ),

  updateProfile: (profileData) =>
    get()._handleAuthAction(
      () => authService.updateProfile(profileData),
      'Profile updated successfully!'
    ),
}));

export default useAuthStore;
