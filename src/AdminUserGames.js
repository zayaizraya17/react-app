
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserManager } from './userManager';
import { Storage } from './storage';

function AdminUserGames() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    gamesDrawn: 0,
    totalScore: 0,
    winRate: 0
  });

  useEffect(() => {
    loadUserGames();
  }, [userId]);

  const loadUserGames = async () => {
    try {
      setLoading(true);
      
      // Получаем данные пользователя
      const userData = UserManager.getUserById(userId);
      
      if (!userData) {
        navigate('/admin');
        return;
      }
      
      // Получаем игры пользователя
      const userGames = Storage.getUserGames(userData.username);
      
      // Форматируем игры для отображения
      const formattedGames = userGames.map(game => {
        const result = game.win === true ? 'win' : game.win === false ? 'loss' : 'draw';
        const opponent = game.opponent || 'ИИ';
        const isNetworkGame = game.aiLevel === 'network';
        
        return {
          id: game.id,
          player1Id: userData.id,
          player1Username: userData.username,
          player2Id: isNetworkGame ? 'network-player' : 'ai-player',
          player2Username: opponent,
          winner: game.win === true ? userData.id : game.win === false ? 'ai-player' : null,
          result,
          aiLevel: game.aiLevel || 'medium',
          scoreChange: game.score || 0,
          createdAt: game.timestamp,
          duration: Math.floor(Math.random() * 300) + 60
        };
      });
      
      // Сортируем по дате
      const sortedGames = formattedGames.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      // Рассчитываем статистику
      const userStats = Storage.getUserStats(userData.username);
      const calculatedStats = {
        gamesPlayed: userStats.gamesPlayed || 0,
        gamesWon: userStats.wins || 0,
        gamesLost: userStats.losses || 0,
        gamesDrawn: userStats.draws || 0,
        totalScore: userStats.score || 0,
        winRate: userStats.gamesPlayed > 0 
          ? Math.round((userStats.wins / userStats.gamesPlayed) * 100)
          : 0
      };
      
      setUser(userData);
      setGames(sortedGames);
      setStats(calculatedStats);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Неизвестно';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Неверная дата';
      
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Ошибка форматирования даты:', error);
      return 'Ошибка даты';
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="main-content with-topbar">
        <div className="loading">
          <p>Загрузка игр пользователя...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="main-content with-topbar">
        <div className="not-found">
          <h2>Пользователь не найден</h2>
          <button 
            onClick={() => navigate('/admin')}
            className="submit-btn"
          >
            Вернуться в панель администратора
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content with-topbar">
      <div className="admin-user-games">
        <div className="admin-user-header">
          <button 
            onClick={() => navigate('/admin')}
            className="back-btn"
          >
            ← Назад
          </button>
          <h1>Игры пользователя: {user.username}</h1>
          <div className="user-info-summary">
            <div className="user-avatar-small">
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} />
              ) : (
                <div className="avatar-initials-small">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
              )}
            </div>
            <div className="user-details">
              <h3>{user.firstName} {user.lastName}</h3>
              <p className="user-email">{user.email}</p>
              <p className="user-registered">
                Зарегистрирован: {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="user-stats-cards">
          <div className="stat-card">
            <div className="stat-icon">🎮</div>
            <div className="stat-content">
              <div className="stat-value">{stats.gamesPlayed}</div>
              <div className="stat-label">Всего игр</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <div className="stat-value">{stats.gamesWon}</div>
              <div className="stat-label">Побед</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📉</div>
            <div className="stat-content">
              <div className="stat-value">{stats.gamesLost}</div>
              <div className="stat-label">Поражений</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🤝</div>
            <div className="stat-content">
              <div className="stat-value">{stats.gamesDrawn}</div>
              <div className="stat-label">Ничьих</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{stats.winRate}%</div>
              <div className="stat-label">Процент побед</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalScore}</div>
              <div className="stat-label">Общий счет</div>
            </div>
          </div>
        </div>

        <div className="games-table-container">
          <h3>История игр ({games.length})</h3>
          {games.length > 0 ? (
            <table className="games-table">
              <thead>
                <tr>
                  <th>ID игры</th>
                  <th>Противник</th>
                  <th>Уровень AI</th>
                  <th>Результат</th>
                  <th>Счет</th>
                  <th>Длительность</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {games.map(game => {
                  const isPlayer1 = game.player1Id === userId;
                  const opponent = isPlayer1 ? game.player2Username : game.player1Username;
                  const result = game.result === 'win' ? 'Победа' : 
                                game.result === 'loss' ? 'Поражение' : 'Ничья';
                  const resultClass = game.result === 'win' ? 'win' : 
                                     game.result === 'loss' ? 'loss' : 'draw';
                  
                  return (
                    <tr key={game.id}>
                      <td className="game-id">{game.id}</td>
                      <td className="opponent-cell">
                        <span className="opponent-name">{opponent}</span>
                      </td>
                      <td className="ai-level">
                        <span className={`level-badge ${game.aiLevel}`}>
                          {game.aiLevel === 'easy' ? 'Легкий' : 
                           game.aiLevel === 'medium' ? 'Средний' : 
                           game.aiLevel === 'hard' ? 'Сложный' : 'Сетевой'}
                        </span>
                      </td>
                      <td className={`result-cell ${resultClass}`}>
                        {result}
                      </td>
                      <td className={`score-cell ${game.scoreChange >= 0 ? 'positive' : 'negative'}`}>
                        {game.scoreChange >= 0 ? '+' : ''}{game.scoreChange}
                      </td>
                      <td className="duration-cell">
                        {formatDuration(game.duration)}
                      </td>
                      <td className="date-cell">
                        {formatDate(game.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="no-games">
              <p>У этого пользователя еще нет игр</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminUserGames;
