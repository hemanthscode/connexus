import api from './api';
import { AUTH_ENDPOINTS } from '../utils/constants';

export const authService = {
  // Register new user
  register: async (userData) => {
    const response = await api.post(AUTH_ENDPOINTS.REGISTER, userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post(AUTH_ENDPOINTS.LOGIN, credentials);
    return response.data;
  },

  // Logout user
  logout: async () => {
    const response = await api.post(AUTH_ENDPOINTS.LOGOUT);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.put(AUTH_ENDPOINTS.CHANGE_PASSWORD, passwordData);
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
};
