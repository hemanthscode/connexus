/**
 * Authentication Hook
 * Handles auth state and navigation
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { ROUTES } from '../utils/constants';

export const useAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const authStore = useAuthStore();
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    checkAuth,
    register,
    login,
    logout,
    changePassword,
    updateProfile,
  } = authStore;

  // Initialize auth check
  useEffect(() => {
    if (!isInitialized) checkAuth();
  }, [isInitialized, checkAuth]);

  // Helper for auth success navigation
  const navigateAfterAuth = () => {
    const redirectTo = location.state?.from?.pathname || ROUTES.CHAT;
    setTimeout(() => navigate(redirectTo, { replace: true }), 100);
  };

  // Enhanced auth actions with navigation
  const authActions = {
    login: async (credentials) => {
      const result = await login(credentials);
      if (result.success) navigateAfterAuth();
      return result;
    },

    register: async (userData) => {
      const result = await register(userData);
      if (result.success) navigateAfterAuth();
      return result;
    },

    logout: async () => {
      await logout();
      navigate(ROUTES.LOGIN, { replace: true });
    },

    changePassword,
    updateProfile,
  };

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    
    // Actions
    ...authActions,
  };
};

export default useAuth;
