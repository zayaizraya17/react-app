
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  updateUserProfile, 
  updateUserAvatar,
  getUserGames,
  getCurrentUser
} from './firebase';

function Profile() {
  const navigate = useNavigate();
  const { currentUser, user, updateUser, changeAvatar } = useAuth();
  
  // Используем активного пользователя
  const activeUser = user || currentUser;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    avatar: null,
    createdAt: '',
    stats: {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      score: 0,
      winRate: 0
    },
    recentGames: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  const loadProfileData = useCallback(async () => {
    try {
      if (!activeUser) {
        console.log('Пользователь не найден, перенаправление...');
        navigate('/login');
        return;
      }

      setLoading(true);
      setError(null);

      // Используем данные из контекста
      const userData = {
        firstName: activeUser.firstName || activeUser.fullName?.split(' ')[0] || '',
        lastName: activeUser.lastName || activeUser.fullName?.split(' ')[1] || '',
        email: activeUser.email || '',
        avatar: activeUser.avatar || null,
        createdAt: activeUser.createdAt || new Date().toISOString(),
        username: activeUser.username || 'Пользователь'
      };

      // Получаем статистику пользователя
      const stats = activeUser.stats || {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        score: 0,
        winRate: 0
      };
      
      // Получаем игры пользователя из Firebase
      let recentGames = [];
      try {
        const gamesResult = await getUserGames(activeUser.id, 10);
        if (gamesResult.success) {
          recentGames = gamesResult.games.map(game => ({
            id: game.id,
            timestamp: game.timestamp,
            win: game.win,
            score: game.score || 0,
            aiLevel: game.aiLevel || 'medium',
            opponent: game.opponent || 'ИИ',
            type: game.isNetworkGame ? 'network' : 'ai'
          }));
        }
      } catch (gamesError) {
        console.log('Не удалось загрузить игры из Firebase:', gamesError);
      }

      setProfileData({
        ...userData,
        stats,
        recentGames
      });

      setEditForm({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email
      });

    } catch (err) {
      console.error('Ошибка загрузки профиля:', err);
      setError('Не удалось загрузить данные профиля. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  }, [activeUser, navigate]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleSaveProfile = async () => {
    try {
      const updatedData = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        fullName: `${editForm.firstName} ${editForm.lastName}`.trim(),
        email: editForm.email
      };

      // Обновляем в Firebase
      const result = await updateUserProfile(activeUser.id, updatedData);
      
      if (result.success) {
        // Обновляем в контексте
        const updatedUser = {
          ...activeUser,
          ...updatedData
        };
        
        updateUser(activeUser.id, updatedData);

        // Обновляем локальные данные
        setProfileData(prev => ({
          ...prev,
          ...updatedData
        }));

        setIsEditing(false);
        alert('Данные профиля успешно обновлены!');
      } else {
        alert(`Не удалось обновить профиль: ${result.message}`);
      }
    } catch (err) {
      console.error('Ошибка сохранения профиля:', err);
      alert('Не удалось сохранить изменения');
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Проверяем размер файла (максимум 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер: 2MB');
        return;
      }

      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите файл изображения');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const imageData = e.target.result;
          
          // Обновляем аватар в Firebase
          const result = await updateUserAvatar(activeUser.id, imageData);
          
          if (result.success) {
            // Обновляем в контексте
            changeAvatar(activeUser.id, imageData);
            
            // Обновляем локальные данные
            setProfileData(prev => ({ ...prev, avatar: imageData }));
            alert('Аватар успешно обновлен!');
          } else {
            alert(`Не удалось обновить аватар: ${result.message}`);
          }
        } catch (err) {
          console.error('Ошибка загрузки аватара:', err);
          alert('Ошибка при загрузке аватара');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Неизвестно';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString.toDate();
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Неизвестно';
    }
  };

  const calculateWinRate = () => {
    const { gamesPlayed, wins } = profileData.stats;
    if (gamesPlayed === 0) return 0;
    return Math.round((wins / gamesPlayed) * 100);
  };

  const getDifficultyText = (aiLevel) => {
    switch(aiLevel) {
      case 'easy': return 'Легкий';
      case 'medium': return 'Средний';
      case 'hard': return 'Сложный';
      case 'network': return 'Сетевой';
      default: return aiLevel;
    }
  };

  const getResultText = (win) => {
    if (win === true) return 'Победа';
    if (win === false) return 'Поражение';
    return 'Ничья';
  };

  const getResultClass = (win) => {
    if (win === true) return 'win';
    if (win === false) return 'loss';
    return 'draw';
  };

  if (!activeUser) {
    return (
      <div className="main-content with-topbar">
        <div className="not-found">
          <h2>Ошибка авторизации</h2>
          <p>Для просмотра профиля необходимо войти в систему.</p>
          <button 
            onClick={() => navigate('/login')}
            className="play-btn"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="main-content with-topbar">
        <div className="profile-page">
          <div className="loading">
            <p>Загрузка профиля...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content with-topbar">
      <div className="profile-page">
        <div className="profile-header">
          <h1>👤 Мой профиль</h1>
          {error && (
            <div className="error-message" style={{ margin: '1rem 0' }}>
              {error}
              <button 
                onClick={loadProfileData}
                className="play-btn"
                style={{ marginLeft: '1rem' }}
              >
                Повторить
              </button>
            </div>
          )}
        </div>

        <div className="profile-content">
          {/* Карточка профиля */}
          <div className="profile-card">
            <div className="profile-info">
              {/* Аватар */}
              <div className="profile-avatar-container">
                <div className="profile-avatar">
                  {profileData.avatar ? (
                    <img 
                      src={profileData.avatar} 
                      alt="Аватар" 
                      className="avatar-image"
                    />
                  ) : (
                    <div className="avatar-initials">
                      {profileData.firstName?.[0] || activeUser.username?.[0] || 'U'}
                    </div>
                  )}
                </div>
                <label className="avatar-upload-label">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ display: 'none' }}
                  />
                  <span className="edit-avatar-btn">📷 Изменить фото</span>
                </label>
              </div>

              {/* Информация профиля */}
              <div className="profile-details">
                <h2>
                  {profileData.firstName} {profileData.lastName}
                </h2>
                <p className="username">@{activeUser.username}</p>
                
                {isEditing ? (
                  <div className="edit-form">
                    <div className="form-group">
                      <label>Имя:</label>
                      <input
                        type="text"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                        placeholder="Введите имя"
                      />
                    </div>
                    <div className="form-group">
                      <label>Фамилия:</label>
                      <input
                        type="text"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                        placeholder="Введите фамилию"
                      />
                    </div>
                    <div className="form-group">
                      <label>Email:</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        placeholder="Введите email"
                      />
                    </div>
                    <div className="form-actions">
                      <button className="submit-btn" onClick={handleSaveProfile}>
                        Сохранить
                      </button>
                      <button 
                        className="cancel-btn" 
                        onClick={() => setIsEditing(false)}
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="profile-meta">
                    <div className="meta-item">
                      <span className="meta-label">Email:</span>
                      <span className="meta-value">{profileData.email || 'Не указан'}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Дата регистрации:</span>
                      <span className="meta-value">{formatDate(profileData.createdAt)}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Статус:</span>
                      <span className="meta-value">
                        {activeUser.isAdmin ? '👑 Администратор' : '🎮 Игрок'}
                      </span>
                    </div>
                    <div className="profile-actions">
                      <button 
                        className="edit-profile-btn"
                        onClick={() => setIsEditing(true)}
                      >
                        ✏️ Редактировать профиль
                      </button>
                      <button 
                        className="change-password-btn"
                        onClick={() => navigate('/change-password')}
                      >
                        🔒 Сменить пароль
                      </button>
                      <button 
                        className="logout-btn"
                        onClick={() => navigate('/game')}
                      >
                        🎮 Играть
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Статистика */}
          <div className="stats-section">
            <h3>📊 Статистика игр</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🎮</div>
                <div className="stat-content">
                  <div className="stat-value">{profileData.stats.gamesPlayed}</div>
                  <div className="stat-label">Всего игр</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">🏆</div>
                <div className="stat-content">
                  <div className="stat-value">{profileData.stats.wins}</div>
                  <div className="stat-label">Побед</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">💔</div>
                <div className="stat-content">
                  <div className="stat-value">{profileData.stats.losses}</div>
                  <div className="stat-label">Поражений</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">🤝</div>
                <div className="stat-content">
                  <div className="stat-value">{profileData.stats.draws}</div>
                  <div className="stat-label">Ничьих</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <div className="stat-value">{profileData.stats.winRate || calculateWinRate()}%</div>
                  <div className="stat-label">Процент побед</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-content">
                  <div className="stat-value">{profileData.stats.score}</div>
                  <div className="stat-label">Всего очков</div>
                </div>
              </div>
            </div>
          </div>

          {/* Последние игры */}
          <div className="recent-games-section">
            <h3>🎯 Последние игры</h3>
            {profileData.recentGames.length === 0 ? (
              <div className="no-games">
                <p>У вас еще нет сыгранных игр</p>
                <button 
                  className="play-btn"
                  onClick={() => navigate('/game')}
                >
                  Сыграть первую игру
                </button>
              </div>
            ) : (
              <div className="games-table-container">
                <table className="games-table">
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Результат</th>
                      <th>Тип</th>
                      <th>Противник</th>
                      <th>Очки</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profileData.recentGames.map((game, index) => (
                      <tr key={game.id || index}>
                        <td>{formatDate(game.timestamp)}</td>
                        <td className={`result-cell ${getResultClass(game.win)}`}>
                          {getResultText(game.win)}
                        </td>
                        <td>
                          {getDifficultyText(game.aiLevel)}
                          {game.type === 'network' && ' 🌐'}
                        </td>
                        <td className="opponent-cell">
                          {game.opponent}
                        </td>
                        <td className={`score-cell ${game.score > 0 ? 'positive' : game.score < 0 ? 'negative' : 'neutral'}`}>
                          {game.score > 0 ? '+' : ''}{game.score}
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
    </div>
  );
}

export default Profile;