import { create } from 'zustand';
import { authService } from '../services/auth';
import { STORAGE_KEYS } from '../utils/constants';
import toast from 'react-hot-toast';

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: localStorage.getItem(STORAGE_KEYS.TOKEN),
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false, // NEW: Track if initial check is done
  error: null,

  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  setToken: (token) => {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
    set({ token });
  },

  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),

  // Register user
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(userData);
      const { token, user } = response.data;
      
      get().setToken(token);
      set({ 
        user, 
        isAuthenticated: true,
        isInitialized: true 
      });
      
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      set({ error: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      set({ isLoading: false });
    }
  },

  // Login user
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(credentials);
      const { token, user } = response.data;
      
      get().setToken(token);
      set({ 
        user, 
        isAuthenticated: true,
        isInitialized: true 
      });
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      set({ error: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      set({ isLoading: false });
    }
  },

  // Logout user
  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      get().setToken(null);
      set({ 
        user: null, 
        isAuthenticated: false, 
        isInitialized: true,
        error: null 
      });
      toast.success('Logged out successfully');
    }
  },

  // Check auth status on app load - FIXED: Only run once
  checkAuth: async () => {
    const state = get();
    
    // Prevent multiple calls
    if (state.isInitialized || state.isLoading) {
      return;
    }

    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      set({ isInitialized: true, isAuthenticated: false });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await authService.getProfile();
      set({ 
        user: response.data, 
        isAuthenticated: true,
        token,
        isInitialized: true
      });
    } catch (error) {
      // Token is invalid
      console.error('Auth check failed:', error);
      get().setToken(null);
      set({ 
        user: null, 
        isAuthenticated: false,
        isInitialized: true 
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    set({ isLoading: true, error: null });
    try {
      await authService.changePassword(passwordData);
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password change failed';
      set({ error: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useAuthStore;
