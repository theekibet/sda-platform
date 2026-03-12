import { createContext, useState, useContext, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getProfile } from '../services/api';

// Create the context
const AuthContext = createContext(null);

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await getProfile();
      const userData = response.data;
      setUser(userData);
      
      // Store user in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set permissions based on user role
      if (userData.isAdmin) {
        setPermissions(['admin', 'moderate', 'manage_users', 'manage_settings', 'view_reports', 'manage_announcements']);
      } else if (userData.isModerator) {
        setPermissions(['moderate', 'view_reports']);
      } else {
        setPermissions([]);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      setError(null);
      const response = await apiLogin({ email, password });
      const { token, ...userData } = response.data;
      
      // Store token and user
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(token);
      setUser(userData);
      
      // Set permissions based on user role
      if (userData.isAdmin) {
        setPermissions(['admin', 'moderate', 'manage_users', 'manage_settings', 'view_reports', 'manage_announcements']);
      } else if (userData.isModerator) {
        setPermissions(['moderate', 'view_reports']);
      } else {
        setPermissions([]);
      }
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const handleRegister = async (userData) => {
    try {
      setError(null);
      const response = await apiRegister(userData);
      const { token, message, ...newUser } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken(token);
      setUser(newUser);
      
      // Regular users have no special permissions
      setPermissions([]);
      
      return { 
        success: true, 
        message: message || 'Registration successful!'
      };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setPermissions([]);
  };

  // Check if user has a specific permission
  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  // Check if user is admin
  const isAdmin = user?.isAdmin || false;

  // Check if user is moderator
  const isModerator = user?.isModerator || false;

  const value = {
    user,
    setUser,
    loading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout,
    hasPermission,
    isAdmin,
    isModerator,
    permissions,
    token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook - MUST be exported after the provider
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};