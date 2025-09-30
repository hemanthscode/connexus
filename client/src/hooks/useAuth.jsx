import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { ROUTES } from '../utils/constants';

export const useAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    register,
    login,
    logout,
    checkAuth,
    changePassword,
  } = useAuthStore();

  // Check auth ONLY ONCE on mount
  useEffect(() => {
    if (!isInitialized) {
      checkAuth();
    }
  }, [isInitialized]); // FIXED: Only depend on isInitialized

  // Redirect logic after authentication
  const handleAuthSuccess = () => {
    const from = location.state?.from?.pathname || ROUTES.CHAT;
    navigate(from, { replace: true });
  };

  // Enhanced login with redirect
  const handleLogin = async (credentials) => {
    const result = await login(credentials);
    if (result.success) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        handleAuthSuccess();
      }, 100);
    }
    return result;
  };

  // Enhanced register with redirect  
  const handleRegister = async (userData) => {
    const result = await register(userData);
    if (result.success) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        handleAuthSuccess();
      }, 100);
    }
    return result;
  };

  // Enhanced logout with redirect
  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
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
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    changePassword,
  };
};
