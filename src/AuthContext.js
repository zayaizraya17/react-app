
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getCurrentUser, 
  updateUserProfile,
  updateUserAvatar 
} from './firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Загружаем текущего пользователя при монтировании
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser(user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Ошибка загрузки пользователя:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const result = await loginUser(email, password);
      if (result.success) {
        setCurrentUser(result.user);
        setIsAuthenticated(true);
        localStorage.setItem('firebase_user', JSON.stringify(result.user));
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.message || 'Ошибка входа' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Произошла ошибка при входе' };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    try {
      const result = await registerUser(userData);
      if (result.success) {
        setCurrentUser(result.user);
        setIsAuthenticated(true);
        localStorage.setItem('firebase_user', JSON.stringify(result.user));
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.message || 'Ошибка регистрации' };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.message || 'Произошла ошибка при регистрации' };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      const result = await logoutUser();
      if (result.success) {
        setCurrentUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('firebase_user');
        return { success: true };
      }
      return { success: false, error: result.message };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (userId, updates) => {
    try {
      const result = await updateUserProfile(userId, updates);
      if (result.success) {
        setCurrentUser(prev => ({
          ...prev,
          ...updates,
          id: userId
        }));
        return { success: true };
      }
      return { success: false, error: result.message };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const changeAvatar = useCallback(async (userId, avatarUrl) => {
    try {
      const result = await updateUserAvatar(userId, avatarUrl);
      if (result.success) {
        setCurrentUser(prev => ({
          ...prev,
          avatar: avatarUrl
        }));
        return { success: true, avatar: avatarUrl };
      }
      return { success: false, error: result.message };
    } catch (error) {
      console.error('Change avatar error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const value = {
    currentUser,
    user: currentUser,
    loading,
    isAuthenticated,
    isLoggedIn: isAuthenticated,
    isAdmin: currentUser?.isAdmin || false,
    
    // Auth functions
    login,
    register,
    logout,
    updateUser,
    changeAvatar,
    
    // Aliases for compatibility
    loginUser: login,
    signIn: login,
    signOut: logout,
    logoutUser: logout,
    updateCurrentUser: updateUser,
    setUser: updateUser,
    
    // User type checks
    isUser: !currentUser?.isAdmin,
    isRegularUser: !currentUser?.isAdmin,
    isAdministrator: currentUser?.isAdmin || false,
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
