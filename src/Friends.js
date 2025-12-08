// Friends.js - исправленная версия
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Auth } from './auth'; // Для поиска пользователей
import { Storage } from './storage'; // Для управления друзьями и запросами
import { useNavigate } from 'react-router-dom';

const Friends = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadFriendsData = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError('');
    
    try {
      if (activeTab === 'friends') {
        // Используем Storage для получения друзей
        const friendsList = Storage.getFriendsWithInfo(currentUser.username);
        setFriends(friendsList);
      } else if (activeTab === 'requests') {
        // Используем Storage для получения запросов в друзья
        const requests = Storage.getFriendRequests(currentUser.username);
        setFriendRequests(requests.filter(req => req.status === 'pending'));
      }
    } catch (err) {
      setError('Ошибка загрузки данных друзей');
      console.error('Ошибка загрузки друзей:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, activeTab]);

  useEffect(() => {
    loadFriendsData();
  }, [loadFriendsData]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim() || !currentUser) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Используем Auth.searchUsers для поиска
      const results = Auth.searchUsers(searchTerm, currentUser.username);
      
      // Добавляем информацию о статусе дружбы через Storage
      const resultsWithStatus = results.map(user => ({
        ...user,
        friendshipStatus: Storage.getFriendshipStatus(currentUser.username, user.username)
      }));
      
      setSearchResults(resultsWithStatus);
      setActiveTab('search');
    } catch (err) {
      setError('Ошибка поиска пользователей');
      console.error('Ошибка поиска:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (toUsername) => {
    if (!currentUser) return;
    
    try {
      // Используем Storage для отправки запроса
      const result = Storage.sendFriendRequest(currentUser.username, toUsername);
      if (result) {
        setSuccessMessage(`Запрос в друзья отправлен пользователю ${toUsername}`);
        setTimeout(() => setSuccessMessage(''), 3000);
        loadFriendsData();
      }
    } catch (err) {
      setError('Ошибка отправки запроса');
      console.error('Ошибка отправки запроса:', err);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    if (!currentUser) return;
    
    try {
      // Используем Storage для принятия запроса
      const result = Storage.acceptFriendRequest(currentUser.username, requestId);
      if (result) {
        setSuccessMessage('Запрос в друзья принят');
        setTimeout(() => setSuccessMessage(''), 3000);
        loadFriendsData();
      }
    } catch (err) {
      setError('Ошибка принятия запроса');
      console.error('Ошибка принятия запроса:', err);
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!currentUser) return;
    
    try {
      // Используем Storage для отклонения запроса
      const result = Storage.rejectFriendRequest(currentUser.username, requestId);
      if (result) {
        setSuccessMessage('Запрос в друзья отклонен');
        setTimeout(() => setSuccessMessage(''), 3000);
        loadFriendsData();
      }
    } catch (err) {
      setError('Ошибка отклонения запроса');
      console.error('Ошибка отклонения запроса:', err);
    }
  };

  const handleRemoveFriend = async (friendUsername) => {
    if (!currentUser || !window.confirm(`Удалить ${friendUsername} из друзей?`)) return;
    
    try {
      // Используем Storage для удаления друга
      Storage.removeFriend(currentUser.username, friendUsername);
      setSuccessMessage(`${friendUsername} удален из друзей`);
      setTimeout(() => setSuccessMessage(''), 3000);
      loadFriendsData();
    } catch (err) {
      setError('Ошибка удаления друга');
      console.error('Ошибка удаления друга:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Никогда';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours < 1) {
          return 'Сегодня';
        }
        return `${diffHours} ч. назад`;
      }
      
      if (diffDays === 1) return 'Вчера';
      if (diffDays < 7) return `${diffDays} дн. назад`;
      
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Неизвестно';
    }
  };

  const getAvatarContent = (user) => {
    if (user.avatar) {
      return (
        <img 
          src={user.avatar} 
          alt={user.fullName || user.username}
          className="avatar-image-small"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
      );
    }
    
    return (
      <div className="avatar-initials-small" style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#4a6fa5',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '1rem'
      }}>
        {user.fullName?.charAt(0) || user.username?.charAt(0) || '?'}
      </div>
    );
  };

  if (!currentUser) {
    return (
      <div className="friends-page">
        <div className="loading">
          <p>Пожалуйста, войдите в систему</p>
          <button onClick={() => navigate('/login')} className="play-btn">
            Войти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="friends-page">
      <div className="friends-header">
        <h2>👥 Друзья</h2>
        <p>Управление списком друзей и запросами</p>
        
        <div className="friends-search" style={{ marginTop: '1.5rem' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск пользователей по имени или username"
              style={{ flex: 1, padding: '0.75rem' }}
              disabled={loading}
            />
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading || !searchTerm.trim()}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              🔍 Поиск
            </button>
          </form>
        </div>
      </div>

      {/* Уведомления */}
      {error && (
        <div className="error-message" style={{ margin: '1rem 0' }}>
          {error}
        </div>
      )}
      
      {successMessage && (
        <div style={{ 
          padding: '0.75rem',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          border: '1px solid #28a745',
          borderRadius: '5px',
          color: '#155724',
          margin: '1rem 0'
        }}>
          ✅ {successMessage}
        </div>
      )}

      {/* Табы */}
      <div className="friends-tabs" style={{ 
        display: 'flex', 
        gap: '0.5rem',
        margin: '1.5rem 0',
        borderBottom: '1px solid #dee2e6'
      }}>
        <button
          className={`friends-tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
          disabled={loading}
        >
          👥 Друзья ({friends.length})
        </button>
        <button
          className={`friends-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
          disabled={loading}
        >
          📨 Запросы ({friendRequests.length})
        </button>
        {searchResults.length > 0 && (
          <button
            className={`friends-tab-btn ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
            disabled={loading}
          >
            🔍 Результаты поиска ({searchResults.length})
          </button>
        )}
      </div>

      {/* Содержимое табов */}
      <div className="friends-content">
        {loading ? (
          <div className="loading" style={{ padding: '3rem' }}>
            Загрузка...
          </div>
        ) : (
          <>
            {/* Список друзей */}
            {activeTab === 'friends' && (
              <div className="friends-list">
                {friends.length === 0 ? (
                  <div className="empty-state" style={{ 
                    textAlign: 'center', 
                    padding: '3rem',
                    color: '#6c757d'
                  }}>
                    <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>😔 У вас пока нет друзей</p>
                    <p>Найдите друзей через поиск или ждите запросы!</p>
                    <button 
                      onClick={() => {
                        setSearchTerm('');
                        setActiveTab('search');
                        document.querySelector('input[type="text"]')?.focus();
                      }}
                      className="play-btn"
                      style={{ marginTop: '1rem' }}
                    >
                      🔍 Найти друзей
                    </button>
                  </div>
                ) : (
                  <div className="friends-grid">
                    {friends.map((friend) => (
                      <div key={friend.username} className="friend-card" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        marginBottom: '1rem'
                      }}>
                        <div>
                          {getAvatarContent(friend)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <h4 style={{ margin: '0 0 0.25rem 0' }}>
                                {friend.fullName || friend.username}
                              </h4>
                              <p style={{ 
                                margin: '0', 
                                color: '#6c757d', 
                                fontSize: '0.9rem' 
                              }}>
                                @{friend.username}
                              </p>
                            </div>
                            <span style={{ 
                              fontSize: '0.8rem', 
                              color: friend.isOnline ? '#28a745' : '#6c757d'
                            }}>
                              {friend.isOnline ? '🟢 Онлайн' : `⚫ ${formatDate(friend.lastSeen)}`}
                            </span>
                          </div>
                          
                          <div style={{ 
                            display: 'flex', 
                            gap: '0.5rem', 
                            marginTop: '0.75rem',
                            fontSize: '0.85rem'
                          }}>
                            <span>🎮 {friend.gamesPlayed || 0} игр</span>
                            <span>🏆 {friend.wins || 0} побед</span>
                            <span>⭐ {friend.score || 0} очков</span>
                          </div>
                        </div>
                        <div className="friend-actions">
                          <button
                            onClick={() => navigate(`/profile/${friend.username}`)}
                            className="friend-action-btn"
                            style={{ 
                              padding: '0.5rem 1rem',
                              backgroundColor: '#4a6fa5',
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            👁️ Профиль
                          </button>
                          <button
                            onClick={() => handleRemoveFriend(friend.username)}
                            className="friend-action-btn"
                            style={{ 
                              padding: '0.5rem 1rem',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              marginLeft: '0.5rem'
                            }}
                          >
                            ❌ Удалить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Запросы в друзья */}
            {activeTab === 'requests' && (
              <div className="requests-list">
                {friendRequests.length === 0 ? (
                  <div className="empty-state" style={{ 
                    textAlign: 'center', 
                    padding: '3rem',
                    color: '#6c757d'
                  }}>
                    <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>📭 Нет новых запросов</p>
                    <p>Здесь будут отображаться входящие запросы в друзья</p>
                  </div>
                ) : (
                  <div className="requests-grid">
                    {friendRequests.map((request) => {
                      // Получаем информацию о пользователе из Storage
                      const sender = Storage.getUser(request.from);
                      const avatar = Storage.getUserAvatar(request.from);
                      
                      return (
                        <div key={request.id} className="request-card" style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '1rem',
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          marginBottom: '1rem'
                        }}>
                          <div>
                            {avatar ? (
                              <img 
                                src={avatar} 
                                alt={sender?.fullName || request.from}
                                style={{
                                  width: '50px',
                                  height: '50px',
                                  borderRadius: '50%',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                backgroundColor: '#4a6fa5',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '1.2rem'
                              }}>
                                {sender?.fullName?.charAt(0) || request.from?.charAt(0) || '?'}
                              </div>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 0.25rem 0' }}>
                              {sender?.fullName || request.from}
                            </h4>
                            <p style={{ 
                              margin: '0', 
                              color: '#6c757d', 
                              fontSize: '0.9rem' 
                            }}>
                              @{request.from}
                            </p>
                            <p style={{ 
                              margin: '0.25rem 0 0 0', 
                              fontSize: '0.8rem', 
                              color: '#999' 
                            }}>
                              {formatDate(request.timestamp)}
                            </p>
                          </div>
                          <div className="request-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleAcceptRequest(request.id)}
                              className="request-action-btn accept"
                              style={{ 
                                padding: '0.5rem 1rem',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                              }}
                            >
                              ✅ Принять
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              className="request-action-btn reject"
                              style={{ 
                                padding: '0.5rem 1rem',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                              }}
                            >
                              ❌ Отклонить
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Результаты поиска */}
            {activeTab === 'search' && (
              <div className="search-results">
                {searchResults.length === 0 ? (
                  <div className="empty-state" style={{ 
                    textAlign: 'center', 
                    padding: '3rem',
                    color: '#6c757d'
                  }}>
                    <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>🔍 Ничего не найдено</p>
                    <p>Попробуйте другой поисковый запрос</p>
                  </div>
                ) : (
                  <div className="search-grid">
                    {searchResults.map((user) => (
                      <div key={user.username} className="user-card" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        marginBottom: '1rem'
                      }}>
                        <div>
                          {getAvatarContent(user)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 0.25rem 0' }}>
                            {user.fullName || user.username}
                          </h4>
                          <p style={{ 
                            margin: '0', 
                            color: '#6c757d', 
                            fontSize: '0.9rem' 
                          }}>
                            @{user.username}
                          </p>
                          <div style={{ 
                            display: 'flex', 
                            gap: '0.5rem', 
                            marginTop: '0.5rem',
                            fontSize: '0.85rem'
                          }}>
                            <span>🎮 {user.gamesPlayed || 0} игр</span>
                            <span>⭐ {user.score || 0} очков</span>
                          </div>
                        </div>
                        <div className="user-actions">
                          {user.friendshipStatus?.status === 'friends' ? (
                            <span style={{ 
                              padding: '0.5rem 1rem',
                              backgroundColor: '#28a745',
                              color: 'white',
                              borderRadius: '5px',
                              fontSize: '0.85rem'
                            }}>
                              ✅ Друг
                            </span>
                          ) : user.friendshipStatus?.status === 'request_sent' ? (
                            <span style={{ 
                              padding: '0.5rem 1rem',
                              backgroundColor: '#ffc107',
                              color: '#212529',
                              borderRadius: '5px',
                              fontSize: '0.85rem'
                            }}>
                              📨 Запрос отправлен
                            </span>
                          ) : user.friendshipStatus?.status === 'request_received' ? (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleAcceptRequest(user.friendshipStatus.requestId)}
                                style={{ 
                                  padding: '0.5rem 1rem',
                                  backgroundColor: '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '5px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem'
                                }}
                              >
                                ✅ Принять
                              </button>
                              <button
                                onClick={() => handleRejectRequest(user.friendshipStatus.requestId)}
                                style={{ 
                                  padding: '0.5rem 1rem',
                                  backgroundColor: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '5px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem'
                                }}
                              >
                                ❌ Отклонить
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSendFriendRequest(user.username)}
                              style={{ 
                                padding: '0.5rem 1rem',
                                backgroundColor: '#4a6fa5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                              }}
                            >
                              👥 Добавить в друзья
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Friends;