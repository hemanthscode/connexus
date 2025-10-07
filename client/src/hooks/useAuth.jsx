/**
 * Authentication Hook - OPTIMIZED WITH UTILITIES
 * Enhanced auth state and navigation with validation
 */
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { ROUTES } from '../utils/constants';
import { formatError } from '../utils/formatters';

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
    clearError,
  } = authStore;

  // Initialize auth check
  useEffect(() => {
    if (!isInitialized) checkAuth();
  }, [isInitialized, checkAuth]);

  // Helper for auth success navigation - ENHANCED
  const navigateAfterAuth = () => {
    const redirectTo = location.state?.from?.pathname || ROUTES.CHAT;
    setTimeout(() => navigate(redirectTo, { replace: true }), 100);
  };

  // Enhanced auth actions with navigation and error handling
  const authActions = {
    login: async (credentials) => {
      try {
        const result = await login(credentials);
        if (result.success) navigateAfterAuth();
        return result;
      } catch (error) {
        return { success: false, error: formatError(error) };
      }
    },

    register: async (userData) => {
      try {
        const result = await register(userData);
        if (result.success) navigateAfterAuth();
        return result;
      } catch (error) {
        return { success: false, error: formatError(error) };
      }
    },

    logout: async () => {
      try {
        await logout();
        navigate(ROUTES.LOGIN, { replace: true });
      } catch (error) {
        console.warn('Logout navigation failed:', formatError(error));
      }
    },

    changePassword,
    updateProfile,
    clearError,
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
    
    // Utilities - ENHANCED
    isTokenExpired: !authStore.isTokenValid(),
    hasValidSession: isAuthenticated && authStore.isTokenValid(),
  };
};

export default useAuth;
