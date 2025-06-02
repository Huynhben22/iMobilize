// src/context/AuthContext.js - Original Working Version
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import ApiService from '../services/Api';

const AuthContext = createContext();

// Auth state management
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true, error: null };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        error: null,
      };
    
    case 'LOGOUT':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        error: null,
      };
    
    case 'ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    
    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    
    default:
      return state;
  }
};

const initialState = {
  loading: true,
  isAuthenticated: false,
  user: null,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      dispatch({ type: 'LOADING' });
      
      const token = await ApiService.getToken();
      if (token) {
        // Verify token with server
        const response = await ApiService.verifyToken();
        
        if (response.success) {
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: response.data.user },
          });
        } else {
          // Token invalid, clear it
          await ApiService.clearToken();
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // If verification fails, clear token and logout
      await ApiService.clearToken();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const login = async (credentials) => {
    try {
      dispatch({ type: 'LOADING' });
      
      const response = await ApiService.login(credentials);
      
      if (response.success) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: response.data.user },
        });
        return { success: true };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'An error occurred during login';
      dispatch({ type: 'ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'LOADING' });
      
      const response = await ApiService.register(userData);
      
      if (response.success) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: response.data.user },
        });
        return { success: true };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'An error occurred during registration';
      dispatch({ type: 'ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await ApiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await ApiService.updateProfile(profileData);
      
      if (response.success) {
        // Check if response contains updated user data
        if (response.data && response.data.user) {
          console.log('Updating user context with:', response.data.user);
          dispatch({
            type: 'UPDATE_PROFILE',
            payload: response.data.user,
          });
        } else {
          // If API doesn't return updated user, merge the changes manually
          console.log('Manually updating user context with:', profileData);
          dispatch({
            type: 'UPDATE_PROFILE',
            payload: profileData,
          });
        }
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'An error occurred updating profile';
      dispatch({ type: 'ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const clearError = () => {
    dispatch({ type: 'ERROR', payload: null });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    checkAuthStatus,
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