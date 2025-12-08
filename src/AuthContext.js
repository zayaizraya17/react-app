// AuthContext.js - исправленная версия
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Auth as AuthService } from './auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => AuthService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!AuthService.getCurrentUser());

  const updateAuthState = useCallback((user) => {
    setCurrentUser(user);
    setIsAuthenticated(!!user);
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const result = await AuthService.login(username, password);
      if (result.success) {
        updateAuthState(result.user);
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.message || 'Ошибка входа' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Произошла ошибка при входе' };
    }
  }, [updateAuthState]);

  const register = useCallback(async (userData) => {
    try {
      const result = await AuthService.register(userData);
      if (result.success) {
        // Автоматически логиним после успешной регистрации
        const loginResult = await AuthService.login(userData.username, userData.password);
        if (loginResult.success) {
          updateAuthState(loginResult.user);
          return { success: true, user: loginResult.user };
        } else {
          return { 
            success: false, 
            error: loginResult.message || 'Регистрация успешна, но не удалось войти автоматически' 
          };
        }
      } else {
        return { success: false, error: result.message || 'Ошибка регистрации' };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.message || 'Произошла ошибка при регистрации' };
    }
  }, [updateAuthState]);

  const logout = useCallback(() => {
    AuthService.logout();
    updateAuthState(null);
  }, [updateAuthState]);

  const updateUser = useCallback((updatedUser) => {
    setCurrentUser(updatedUser);
    AuthService.updateCurrentUser(updatedUser);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const user = AuthService.getCurrentUser();
      updateAuthState(user);
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [updateAuthState]);

  useEffect(() => {
    if (currentUser) {
      AuthService.updateCurrentUser(currentUser);
    }
  }, [currentUser]);

  const value = {
    currentUser,
    user: currentUser,
    isAuthenticated,
    isLoggedIn: isAuthenticated,
    isAdmin: currentUser?.isAdmin || false,
    
    login,
    register,
    logout,
    updateUser,
    
    loginUser: login,
    signIn: login,
    signOut: logout,
    logoutUser: logout,
    updateCurrentUser: updateUser,
    setUser: updateUser,
    
    isUser: !currentUser?.isAdmin,
    isRegularUser: !currentUser?.isAdmin,
    isAdministrator: currentUser?.isAdmin || false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;