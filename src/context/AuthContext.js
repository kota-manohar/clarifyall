import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const userData = await authService.getCurrentUser();
        if (userData) {
          // Normalize is_verified - ensure both formats exist for compatibility
          if (userData.is_verified !== undefined) {
            userData.isVerified = userData.is_verified === 1 || userData.is_verified === true || userData.is_verified === '1';
          }
          setUser(userData);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      // Ensure is_verified field is present (backend returns is_verified in snake_case)
      const user = response.user || {};
      // Normalize is_verified - ensure both formats exist for compatibility
      if (user.is_verified !== undefined) {
        user.isVerified = user.is_verified === 1 || user.is_verified === true || user.is_verified === '1';
      }
      setUser(user);
      setIsAuthenticated(true);
      return { success: true, message: response.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Login failed' 
      };
    }
  };

  const register = async (email, password, name) => {
    try {
      const response = await authService.register(email, password, name);
      // Ensure is_verified field is present (backend returns is_verified in snake_case)
      const user = response.user || {};
      // Normalize is_verified - ensure both formats exist for compatibility
      if (user.is_verified !== undefined) {
        user.isVerified = user.is_verified === 1 || user.is_verified === true || user.is_verified === '1';
      }
      setUser(user);
      setIsAuthenticated(true);
      return { success: true, message: response.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
