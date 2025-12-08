import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Storage } from './storage';
import { useNavigate } from 'react-router-dom';

function Topbar() {
  const navigate = useNavigate();
  const { currentUser, user, logout, isAdmin } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);
  const [friendRequestCount, setFriendRequestCount] = useState(0);

  // Определяем активного пользователя (для совместимости со старым и новым кодом)
  const activeUser = user || currentUser;
  const userIsAdmin = isAdmin || activeUser?.isAdmin;

  // Загружаем аватар пользователя
  useEffect(() => {
    if (activeUser?.username) {
      const avatar = Storage.getUserAvatar(activeUser.username);
      setUserAvatar(avatar);
      
      // Загружаем количество непрочитанных запросов в друзья (только для обычных пользователей)
      if (!userIsAdmin) {
        loadFriendRequestCount();
      }
    }
  }, [activeUser, userIsAdmin]);

  // Функция для загрузки количества запросов в друзья
  const loadFriendRequestCount = () => {
    if (activeUser?.username) {
      try {
        const requests = Storage.getFriendRequests(activeUser.username);
        const pendingRequests = requests.filter(req => req.status === 'pending');
        setFriendRequestCount(pendingRequests.length);
      } catch (error) {
        console.error('Ошибка загрузки запросов в друзья:', error);
        setFriendRequestCount(0);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    setShowProfileMenu(false);
    navigate(path);
  };

  const handleProfileClick = () => {
    setShowProfileMenu(false);
    navigate('/profile');
  };

  const handleGameClick = () => {
    setShowProfileMenu(false);
    navigate('/game');
  };

  const handleLeaderboardClick = () => {
    setShowProfileMenu(false);
    navigate('/leaderboard');
  };

  const handleFriendsClick = () => {
    setShowProfileMenu(false);
    navigate('/friends');
  };

  const handleAdminClick = () => {
    setShowProfileMenu(false);
    navigate('/admin');
  };

  // Подписываемся на изменения в localStorage для обновления аватара и счетчика запросов
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key && activeUser?.username) {
        // Обновляем аватар при изменении
        if (e.key.includes('tic-tac-toe_avatar')) {
          const avatar = Storage.getUserAvatar(activeUser.username);
          setUserAvatar(avatar);
        }
        
        // Обновляем счетчик запросов в друзья (только для обычных пользователей)
        if (!userIsAdmin && e.key.includes('tic-tac-toe_friend_requests')) {
          loadFriendRequestCount();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [activeUser, userIsAdmin]);

  if (!activeUser) return null;

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div 
          className="logo" 
          onClick={() => navigate(userIsAdmin ? '/admin' : '/game')}
          style={{ cursor: 'pointer' }}
        >
          🎮 Tic-Tac-Toe {userIsAdmin ? '(Admin)' : ''}
        </div>
        <div className="nav-links">
          {!userIsAdmin ? (
            <>
              <button 
                className="nav-link" 
                onClick={handleGameClick}
              >
                Игра
              </button>
              <button 
                className="nav-link" 
                onClick={handleLeaderboardClick}
              >
                Лидерборд
              </button>
              <button 
                className="nav-link" 
                onClick={handleFriendsClick}
                style={{ position: 'relative' }}
              >
                👥 Друзья
                {friendRequestCount > 0 && (
                  <span className="requests-badge">
                    {friendRequestCount}
                  </span>
                )}
              </button>
            </>
          ) : (
            <button 
              className="nav-link" 
              onClick={handleAdminClick}
            >
              Панель администратора
            </button>
          )}
        </div>
      </div>
      
      <div className="user-info">
        <span className="username">
          {activeUser.fullName || activeUser.username}
          {userIsAdmin && (
            <span className="admin-badge" title="Администратор">👑</span>
          )}
        </span>
        
        <div className="profile-menu-container">
          <button 
            className="profile-icon"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            title="Меню профиля"
            style={{ 
              backgroundImage: userAvatar ? `url(${userAvatar})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: userAvatar ? 'transparent' : '#FF7A45',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            {!userAvatar && (activeUser.firstName?.[0] || activeUser.username?.[0] || '👤')}
            
            {/* Бейдж для запросов в друзья (только для обычных пользователей) */}
            {!userIsAdmin && friendRequestCount > 0 && (
              <span className="profile-icon-badge">
                {friendRequestCount}
              </span>
            )}
          </button>
          
          {showProfileMenu && (
            <div className="profile-menu">
              {!userIsAdmin && (
                <>
                  <button 
                    className="profile-menu-item"
                    onClick={handleProfileClick}
                  >
                    👤 Мой профиль
                  </button>
                  <button 
                    className="profile-menu-item"
                    onClick={handleFriendsClick}
                    style={{ position: 'relative' }}
                  >
                    👥 Мои друзья
                    {friendRequestCount > 0 && (
                      <span className="menu-badge">
                        {friendRequestCount}
                      </span>
                    )}
                  </button>
                  <button 
                    className="profile-menu-item"
                    onClick={() => handleNavigation('/change-password')}
                  >
                    🔒 Сменить пароль
                  </button>
                  <button 
                    className="profile-menu-item"
                    onClick={handleGameClick}
                  >
                    🎮 К игре
                  </button>
                  <button 
                    className="profile-menu-item"
                    onClick={handleLeaderboardClick}
                  >
                    🏆 Лидерборд
                  </button>
                </>
              )}
              
              {userIsAdmin && (
                <button 
                  className="profile-menu-item"
                  onClick={handleAdminClick}
                >
                  🛠️ Панель администратора
                </button>
              )}
              
              <button 
                className="profile-menu-item logout-btn"
                onClick={handleLogout}
              >
                🔓 Выйти
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Topbar;