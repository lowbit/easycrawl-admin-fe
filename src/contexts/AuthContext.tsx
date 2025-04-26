import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, LoginRequest, UserResponse } from '@/types/auth';
import { authService } from '@/services/authService';
import axios, { AxiosError } from 'axios';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getErrorMessage = (error: any) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    if (axiosError.response?.status === 401) {
      return 'Invalid username or password. Please try again.';
    }
    if (axiosError.response?.status === 403) {
      return 'You do not have permission to access this resource.';
    }
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    if (axiosError.message === 'Network Error') {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
  }
  return 'An unexpected error occurred. Please try again later.';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(() => authService.getStoredUser());

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authService.login(credentials);
      setUser(response);
      authService.storeUser(response);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error('Login failed:', error);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    setUser(null);
    authService.removeUser();
  };

  const hasRole = (role: string) => {
    return user?.authorities?.includes(role) ?? false;
  };

  // Effect to handle token expiration or invalid token
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
          // Don't throw a generic 401 error here as it might be handled elsewhere
          return Promise.reject(new Error('Your session has expired. Please log in again.'));
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 