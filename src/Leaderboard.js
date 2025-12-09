
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getLeaderboard } from './firebase';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeRange, setTimeRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalGames: 0,
    totalWins: 0
  });
  
  const { currentUser } = useAuth();

  useEffect(() => {
    loadLeaderboard();
  }, [timeRange]);

  const loadLeaderboard = async () => {
    setLoading(true);
    
    try {
      const result = await getLeaderboard(20);
      
      if (result.success) {
        setLeaderboard(result.leaderboard);
        
        // Рассчитываем общую статистику
        const totalStats = result.leaderboard.reduce((acc, player) => ({
          totalPlayers: acc.totalPlayers + 1,
          totalGames: acc.totalGames + (player.gamesPlayed || 0),
          totalWins: acc.totalWins + (player.wins || 0)
        }), { totalPlayers: 0, totalGames: 0, totalWins: 0 });
        
        setStats(totalStats);
      } else {
        console.error('Ошибка загрузки лидерборда:', result.message);
      }
    } catch (error) {
      console.error('Ошибка загрузки лидерборда:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
  if (!timestamp) return 'Никогда';
  
  try {
    // Если timestamp - это Firebase Timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} мин. назад`;
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
    console.error('Ошибка форматирования даты:', error);
    return 'Неизвестно';
  }
};

  const getRankColor = (rank) => {
    switch(rank) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return '#4a6fa5';
    }
  };

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <h2>🏆 Лидерборд</h2>
        <p>Топ игроков по количеству очков</p>
        
        <div className="time-filter">
          <button 
            className={`filter-btn ${timeRange === 'all' ? 'active' : ''}`}
            onClick={() => setTimeRange('all')}
          >
            Все время
          </button>
          <button 
            className={`filter-btn ${timeRange === 'today' ? 'active' : ''}`}
            onClick={() => setTimeRange('today')}
            disabled
          >
            Сегодня
          </button>
          <button 
            className={`filter-btn ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => setTimeRange('week')}
            disabled
          >
            За неделю
          </button>
        </div>
        
        <div className="global-stats">
          <div className="global-stat">
            <span className="stat-label">Игроков:</span>
            <span className="stat-value">{stats.totalPlayers}</span>
          </div>
          <div className="global-stat">
            <span className="stat-label">Игр сыграно:</span>
            <span className="stat-value">{stats.totalGames}</span>
          </div>
          <div className="global-stat">
            <span className="stat-label">Всего побед:</span>
            <span className="stat-value">{stats.totalWins}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : leaderboard.length === 0 ? (
        <div className="empty-leaderboard">
          <p>Пока нет данных для отображения</p>
          <p>Сыграйте первую игру!</p>
        </div>
      ) : (
        <>
          <div className="leaderboard-table-container">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Место</th>
                  <th>Игрок</th>
                  <th>Очки</th>
                  <th>Игры</th>
                  <th>Победы</th>
                  <th>% побед</th>
                  <th>Последняя игра</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((player, index) => {
                  const isCurrentUser = currentUser && player.uid === currentUser.id;
                  
                  return (
                    <tr key={player.uid || index} className={isCurrentUser ? 'current-user-row' : ''}>
                      <td className="rank-cell">
                        <div 
                          className="rank-badge"
                          style={{ backgroundColor: getRankColor(index + 1) }}
                        >
                          {getRankIcon(index + 1)}
                        </div>
                      </td>
                      <td className="player-cell">
                        <div className="player-info">
                          <div className="player-avatar-small">
                            {player.avatar ? (
                              <img src={player.avatar} alt={player.fullName} />
                            ) : (
                              <div className="avatar-initials-small">
                                {player.fullName?.charAt(0) || player.username?.charAt(0) || '?'}
                              </div>
                            )}
                          </div>
                          <div className="player-details">
                            <div className="player-name">
                              {player.fullName || player.username || 'Неизвестный игрок'}
                              {isCurrentUser && <span className="you-badge">Вы</span>}
                            </div>
                            <div className="player-username">
                              @{player.username || 'unknown'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="score-cell">
                        <strong style={{ 
                          color: player.score > 0 ? '#28a745' : player.score < 0 ? '#dc3545' : '#333'
                        }}>
                          {player.score || 0}
                        </strong>
                      </td>
                      <td>{player.gamesPlayed || 0}</td>
                      <td className="win-cell">{player.wins || 0}</td>
                      <td className="win-rate-cell">
                        <div className="win-rate-container">
                          <span className="win-rate-text">{player.winRate || 0}%</span>
                          <div className="win-rate-bar">
                            <div 
                              className="win-rate-fill"
                              style={{ width: `${player.winRate || 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="date-cell">
                        {formatDate(player.lastPlayed)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
