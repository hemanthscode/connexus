import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authApi from '../services/authApi.js';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('connexus_token');
    if (storedToken) {
      try {
        authApi.setAuthToken(storedToken);
        const me = await authApi.getProfile();
        setUser(me);
      } catch {
        localStorage.removeItem('connexus_token');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    localStorage.setItem('connexus_token', data.token);
    authApi.setAuthToken(data.token);
    setUser(data.user);
    navigate('/');
  };

  const register = async (name, email, password) => {
    const data = await authApi.register(name, email, password);
    localStorage.setItem('connexus_token', data.token);
    authApi.setAuthToken(data.token);
    setUser(data.user);
    navigate('/');
  };

  const logout = () => {
    localStorage.removeItem('connexus_token');
    authApi.setAuthToken(null);
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {!loading ? children : <div className="text-center mt-20 text-gray-600">Loading...</div>}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
