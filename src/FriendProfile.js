import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Storage } from './storage';
import { Auth } from './auth';
import { useAuth } from './AuthContext';

const FriendProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [friendData, setFriendData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [friendshipStatus, setFriendshipStatus] = useState({});
  const [userAvatar, setUserAvatar] = useState(null);
  const [recentGames, setRecentGames] = useState([]);

  useEffect(() => {
    const loadFriendData = () => {
      if (!username || !currentUser) {
        setError('Данные не загружены');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError('');
      
      try {
        const user = Storage.getUser(username);
        if (!user) {
          setError('Пользователь не найден');
          setLoading(false);
          return;
        }
        
        // Загружаем статистику
        const stats = Storage.getUserStats(username);
        
        // Загружаем аватар
        const avatar = Storage.getUserAvatar(username);
        setUserAvatar(avatar);
        
        // Загружаем последние игры
        const games = Storage.getUserGames(username)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5);
        setRecentGames(games);
        
        // Проверяем статус дружбы
        const friendship = Auth.getFriendshipStatus(currentUser.username, username);
        setFriendshipStatus(friendship);
        
        // Объединяем данные пользователя и статистику
        const fullData = {
          ...user,
          ...stats,
          avatar,
          gamesPlayed: stats.gamesPlayed || user.gamesPlayed || 0,
          wins: stats.wins || user.wins || 0,
          losses: stats.losses || user.losses || 0,
          draws: stats.draws || user.draws || 0,
          score: stats.score || user.score || 0,
          lastPlayed: stats.lastPlayed || user.lastPlayed || null
        };
        
        setFriendData(fullData);
      } catch (err) {
        console.error('Ошибка загрузки данных друга:', err);
        setError('Не удалось загрузить данные пользователя');
      } finally {
        setLoading(false);
      }
    };
    
    loadFriendData();
  }, [username, currentUser]);

  const handleSendFriendRequest = () => {
    if (!currentUser || !username) return;
    
    try {
      const result = Auth.sendFriendRequest(currentUser.username, username);
      if (result) {
        // Обновляем статус дружбы
        const updatedStatus = Auth.getFriendshipStatus(currentUser.username, username);
        setFriendshipStatus(updatedStatus);
        alert(`Запрос в друзья отправлен пользователю ${username}`);
      }
    } catch (err) {
      console.error('Ошибка отправки запроса:', err);
      alert('Не удалось отправить запрос в друзья');
    }
  };

  const handleRemoveFriend = () => {
    if (!currentUser || !username || !window.confirm(`Удалить ${username} из друзей?`)) return;
    
    try {
      Auth.removeFriend(currentUser.username, username);
      const updatedStatus = Auth.getFriendshipStatus(currentUser.username, username);
      setFriendshipStatus(updatedStatus);
      alert(`${username} удален из друзей`);
    } catch (err) {
      console.error('Ошибка удаления друга:', err);
      alert('Не удалось удалить друга');
    }
  };

  const handleAcceptRequest = () => {
    if (!friendshipStatus.requestId || !currentUser) return;
    
    try {
      Auth.acceptFriendRequest(currentUser.username, friendshipStatus.requestId);
      const updatedStatus = Auth.getFriendshipStatus(currentUser.username, username);
      setFriendshipStatus(updatedStatus);
      alert('Запрос в друзья принят');
    } catch (err) {
      console.error('Ошибка принятия запроса:', err);
      alert('Не удалось принять запрос');
    }
  };

  const handleRejectRequest = () => {
    if (!friendshipStatus.requestId || !currentUser) return;
    
    try {
      Auth.rejectFriendRequest(currentUser.username, friendshipStatus.requestId);
      const updatedStatus = Auth.getFriendshipStatus(currentUser.username, username);
      setFriendshipStatus(updatedStatus);
      alert('Запрос в друзья отклонен');
    } catch (err) {
      console.error('Ошибка отклонения запроса:', err);
      alert('Не удалось отклонить запрос');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Никогда';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Неверная дата';
    }
  };

  const getWinRate = () => {
    if (!friendData || friendData.gamesPlayed === 0) return 0;
    return Math.round((friendData.wins / friendData.gamesPlayed) * 100);
  };

  const getResultIcon = (win) => {
    if (win === true) return '✅';
    if (win === false) return '❌';
    return '➖';
  };

  const getResultText = (win) => {
    if (win === true) return 'Победа';
    if (win === false) return 'Поражение';
    return 'Ничья';
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading">Загрузка профиля друга...</div>
      </div>
    );
  }

  if (error || !friendData) {
    return (
      <div className="profile-page">
        <div className="error-message" style={{ margin: '2rem', padding: '2rem' }}>
          <h3>Ошибка</h3>
          <p>{error || 'Не удалось загрузить данные пользователя'}</p>
          <button onClick={() => navigate(-1)} className="play-btn">
            Назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <button 
          onClick={() => navigate(-1)} 
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          ← Назад
        </button>
        <h2>👤 Профиль пользователя</h2>
        <p>Информация и статистика</p>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-info">
            <div className="profile-avatar-container">
              <div className="profile-avatar">
                {userAvatar ? (
                  <img 
                    src={userAvatar} 
                    alt="Аватар пользователя" 
                    className="avatar-image"
                  />
                ) : (
                  <div className="avatar-initials">
                    {friendData.fullName?.charAt(0) || friendData.username?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            </div>
            
            <div className="profile-details">
              <h3>{friendData.fullName || friendData.username}</h3>
              <p className="username">@{friendData.username}</p>
              
              <div className="profile-meta">
                {friendData.email && (
                  <div className="meta-item">
                    <span className="meta-label">Email:</span>
                    <span className="meta-value">{friendData.email}</span>
                  </div>
                )}
                
                {friendData.phone && (
                  <div className="meta-item">
                    <span className="meta-label">Телефон:</span>
                    <span className="meta-value">{friendData.phone}</span>
                  </div>
                )}
                
                <div className="meta-item">
                  <span className="meta-label">Дата регистрации:</span>
                  <span className="meta-value">
                    {formatDate(friendData.createdAt)}
                  </span>
                </div>
                
                <div className="meta-item">
                  <span className="meta-label">Последняя игра:</span>
                  <span className="meta-value">
                    {formatDate(friendData.lastPlayed)}
                  </span>
                </div>
              </div>
              
              {/* Кнопки управления дружбой */}
              <div className="profile-actions" style={{ 
                display: 'flex', 
                gap: '1rem', 
                marginTop: '1.5rem',
                flexWrap: 'wrap'
              }}>
                {friendshipStatus.status === 'friends' ? (
                  <>
                    <button 
                      onClick={() => navigate(`/game`)}
                      className="play-btn"
                      style={{ backgroundColor: '#28a745' }}
                    >
                      🎮 Пригласить в игру
                    </button>
                    <button 
                      onClick={handleRemoveFriend}
                      className="play-btn"
                      style={{ backgroundColor: '#dc3545' }}
                    >
                      ❌ Удалить из друзей
                    </button>
                  </>
                ) : friendshipStatus.status === 'request_sent' ? (
                  <button 
                    className="play-btn"
                    style={{ backgroundColor: '#ffc107', color: '#212529' }}
                    disabled
                  >
                    📨 Запрос отправлен
                  </button>
                ) : friendshipStatus.status === 'request_received' ? (
                  <>
                    <button 
                      onClick={handleAcceptRequest}
                      className="play-btn"
                      style={{ backgroundColor: '#28a745' }}
                    >
                      ✅ Принять запрос
                    </button>
                    <button 
                      onClick={handleRejectRequest}
                      className="play-btn"
                      style={{ backgroundColor: '#dc3545' }}
                    >
                      ❌ Отклонить
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={handleSendFriendRequest}
                    className="play-btn"
                  >
                    👥 Добавить в друзья
                  </button>
                )}
                
                {currentUser.username === username && (
                  <button 
                    onClick={() => navigate('/profile')}
                    className="play-btn"
                  >
                    🔙 Мой профиль
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="stats-section">
          <h3>📊 Статистика игр</h3>
          
          <div className="stats-grid">
            <div className="stat-card total-games">
              <div className="stat-icon">🎮</div>
              <div className="stat-content">
                <div className="stat-value">{friendData.gamesPlayed || 0}</div>
                <div className="stat-label">Всего игр</div>
              </div>
            </div>
            
            <div className="stat-card wins">
              <div className="stat-icon">🏆</div>
              <div className="stat-content">
                <div className="stat-value">{friendData.wins || 0}</div>
                <div className="stat-label">Побед</div>
              </div>
            </div>
            
            <div className="stat-card losses">
              <div className="stat-icon">💔</div>
              <div className="stat-content">
                <div className="stat-value">{friendData.losses || 0}</div>
                <div className="stat-label">Поражений</div>
              </div>
            </div>
            
            <div className="stat-card draws">
              <div className="stat-icon">🤝</div>
              <div className="stat-content">
                <div className="stat-value">{friendData.draws || 0}</div>
                <div className="stat-label">Ничьих</div>
              </div>
            </div>
            
            <div className="stat-card win-rate">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <div className="stat-value">{getWinRate()}%</div>
                <div className="stat-label">Процент побед</div>
              </div>
            </div>
            
            <div className="stat-card total-score">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <div className="stat-value">{friendData.score || 0}</div>
                <div className="stat-label">Всего очков</div>
              </div>
            </div>
          </div>
        </div>

        <div className="recent-games-section">
          <h3>🎯 Последние игры</h3>
          
          {recentGames.length === 0 ? (
            <div className="no-games">
              <p>Пользователь еще не сыграл ни одной игры</p>
            </div>
          ) : (
            <div className="games-table-container">
              <table className="games-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Результат</th>
                    <th>Сложность</th>
                    <th>Очки</th>
                  </tr>
                </thead>
                <tbody>
                  {recentGames.map((game, index) => (
                    <tr key={game.id || index}>
                      <td>{formatDate(game.timestamp)}</td>
                      <td className={`result-cell ${game.win === true ? 'win' : game.win === false ? 'loss' : 'draw'}`}>
                        <span className="result-icon">{getResultIcon(game.win)}</span>
                        <span className="result-text">{getResultText(game.win)}</span>
                      </td>
                      <td className="ai-level">
                        {game.aiLevel === 'easy' ? 'Легкий' : 
                         game.aiLevel === 'medium' ? 'Средний' : 'Сложный'}
                      </td>
                      <td className="game-score">
                        {game.score > 0 ? (
                          <span style={{ color: '#28a745', fontWeight: 'bold' }}>+{game.score}</span>
                        ) : game.score < 0 ? (
                          <span style={{ color: '#dc3545', fontWeight: 'bold' }}>{game.score}</span>
                        ) : (
                          <span style={{ color: '#6c757d' }}>{game.score}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendProfile;