// App.js - Объединенный основной файл приложения
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Topbar from './Topbar';
import Login from './Login';
import Register from './Register';
import GameBoard from './GameBoard';
import Leaderboard from './Leaderboard';
import Profile from './Profile';
import FriendProfile from './FriendProfile';
import ChangePassword from './ChangePassword';
import Friends from './Friends';
import AdminDashboard from './AdminDashboard';
import AdminUserGames from './AdminUserGames';
import './styles.css';

// Защищенный маршрут
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Публичный маршрут (только для неавторизованных)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Маршрут только для обычных пользователей (не админов)
const UserOnlyRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  return children;
};

// Основной компонент с роутами
const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <>
      {/* Topbar показывается только для авторизованных пользователей */}
      {user && <Topbar />}
      
      <div className={`main-content ${user ? 'with-topbar' : ''}`}>
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          
          {/* Защищенные маршруты для обычных пользователей */}
          <Route path="/game" element={
            <UserOnlyRoute>
              <GameBoard />
            </UserOnlyRoute>
          } />
          
          <Route path="/leaderboard" element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
  <ProtectedRoute>
    <Profile />
  </ProtectedRoute>
} />
          
          <Route path="/profile/:username" element={
            <ProtectedRoute>
              <FriendProfile />
            </ProtectedRoute>
          } />
          
          <Route path="/change-password" element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          } />
          
          <Route path="/friends" element={
            <UserOnlyRoute>
              <Friends />
            </UserOnlyRoute>
          } />
          
          {/* Административные маршруты */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/user/:userId/games" element={
            <ProtectedRoute adminOnly>
              <AdminUserGames />
            </ProtectedRoute>
          } />
          
          {/* Перенаправления */}
          <Route path="/" element={
            user ? (
              user.isAdmin ? (
                <Navigate to="/admin" replace />
              ) : (
                <Navigate to="/game" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          {/* 404 страница */}
          <Route path="*" element={
            <div className="not-found">
              <h2>404 - Страница не найдена</h2>
              <p>Запрошенная страница не существует.</p>
            </div>
          } />
        </Routes>
      </div>
    </>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  if (loading) {
    return (
      <div className="loading">
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <AuthProvider value={{ user, login, logout, updateUser }}>
      <Router>
        <div className="app">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;