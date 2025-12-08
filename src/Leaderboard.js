import React, { useState, useEffect } from 'react';
import { Storage } from './storage';
import { useAuth } from './AuthContext';
import { Auth } from './auth';


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

  const loadLeaderboard = () => {
    setLoading(true);
    
    try {
      const leaderboardData = Storage.getLeaderboard(20);
      
      // Считаем общую статистику
      const totalStats = leaderboardData.reduce((acc, player) => ({
        totalPlayers: acc.totalPlayers + 1,
        totalGames: acc.totalGames + (player.gamesPlayed || 0),
        totalWins: acc.totalWins + (player.wins || 0)
      }), { totalPlayers: 0, totalGames: 0, totalWins: 0 });
      
      setLeaderboard(leaderboardData);
      setStats(totalStats);
    } catch (error) {
      console.error('Ошибка загрузки лидерборда:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
      return 'Никогда';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Неверная дата';
      }
      
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      // Если игра была сегодня
      if (diffDays === 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours < 1) {
          const diffMinutes = Math.floor(diffMs / (1000 * 60));
          return `${diffMinutes} мин. назад`;
        }
        return `${diffHours} ч. назад`;
      }
      
      // Если игра была вчера
      if (diffDays === 1) {
        return 'Вчера';
      }
      
      // Если игра была на этой неделе
      if (diffDays < 7) {
        return `${diffDays} дн. назад`;
      }
      
      // Более недели назад - показываем дату
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Ошибка форматирования даты:', dateString, error);
      return 'Неизвестно';
    }
  };

  const getRankColor = (rank) => {
    switch(rank) {
      case 1: return '#FFD700'; // золото
      case 2: return '#C0C0C0'; // серебро
      case 3: return '#CD7F32'; // бронза
      default: return '#4a6fa5'; // синий для остальных
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

  // Функция для получения аватара игрока
  const getPlayerAvatar = (player) => {
    const avatar = Storage.getUserAvatar(player.username);
    return avatar;
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
          >
            Сегодня
          </button>
          <button 
            className={`filter-btn ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => setTimeRange('week')}
          >
            За неделю
          </button>
          <button 
            className={`filter-btn ${timeRange === 'month' ? 'active' : ''}`}
            onClick={() => setTimeRange('month')}
          >
            За месяц
          </button>
        </div>
        
        <div className="global-stats" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '2rem' }}>
          <div className="global-stat">
            <span className="stat-label">Игроков:</span>
            <span className="stat-value" style={{ color: '#4a6fa5', fontWeight: 'bold' }}>{stats.totalPlayers}</span>
          </div>
          <div className="global-stat">
            <span className="stat-label">Игр сыграно:</span>
            <span className="stat-value" style={{ color: '#4a6fa5', fontWeight: 'bold' }}>{stats.totalGames}</span>
          </div>
          <div className="global-stat">
            <span className="stat-label">Всего побед:</span>
            <span className="stat-value" style={{ color: '#4a6fa5', fontWeight: 'bold' }}>{stats.totalWins}</span>
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
                  <th style={{ width: '80px' }}>Место</th>
                  <th style={{ minWidth: '250px' }}>Игрок</th>
                  <th>Очки</th>
                  <th>Игры</th>
                  <th>Победы</th>
                  <th>Поражения</th>
                  <th>Ничьи</th>
                  <th style={{ minWidth: '120px' }}>Последняя игра</th>
                  <th>% побед</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((player, index) => {
                  const winRate = player.gamesPlayed > 0 
                    ? Math.round((player.wins / player.gamesPlayed) * 100) 
                    : 0;
                  const avatar = getPlayerAvatar(player);
                  const isCurrentUser = currentUser && player.username === currentUser.username;
                  
                  return (
                    <tr key={player.username || index} className={isCurrentUser ? 'current-user-row' : ''}>
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
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.75rem',
                            padding: '0.25rem 0'
                          }}>
                            {/* Круглый аватар */}
                            <div style={{ 
                              width: '50px', 
                              height: '50px', 
                              borderRadius: '50%', // ВАЖНО: круг вместо овала
                              overflow: 'hidden',
                              border: `2px solid ${getRankColor(index + 1)}`,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              flexShrink: 0
                            }}>
                              {avatar ? (
                                <img 
                                  src={avatar} 
                                  alt={player.fullName || player.username}
                                  style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'cover' 
                                  }}
                                  onError={(e) => {
                                    // Если ошибка загрузки изображения, показываем инициалы
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = `
                                      <div style="
                                        width: 100%;
                                        height: 100%;
                                        background: ${getRankColor(index + 1)};
                                        color: white;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-weight: bold;
                                        font-size: 1.2rem;
                                        border-radius: 50%;
                                      ">
                                        ${player.fullName?.charAt(0) || player.username?.charAt(0) || '?'}
                                      </div>
                                    `;
                                  }}
                                />
                              ) : (
                                <div style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  backgroundColor: getRankColor(index + 1),
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 'bold',
                                  fontSize: '1.2rem'
                                }}>
                                  {player.fullName?.charAt(0) || player.username?.charAt(0) || '?'}
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem',
                                flexWrap: 'wrap' 
                              }}>
                                <span className="player-name" style={{ 
                                  fontWeight: '600', 
                                  fontSize: '1rem',
                                  color: isCurrentUser ? '#4a6fa5' : '#333'
                                }}>
                                  {player.fullName || player.username || 'Неизвестный игрок'}
                                  {isCurrentUser && (
                                    <span style={{
                                      marginLeft: '0.5rem',
                                      fontSize: '0.8rem',
                                      backgroundColor: '#4a6fa5',
                                      color: 'white',
                                      padding: '0.1rem 0.4rem',
                                      borderRadius: '10px',
                                      fontWeight: 'normal'
                                    }}>
                                      Вы
                                    </span>
                                  )}
                                </span>
                              </div>
                              <span className="player-username" style={{ 
                                fontSize: '0.875rem', 
                                color: '#6c757d',
                                display: 'block',
                                marginTop: '0.1rem'
                              }}>
                                @{player.username || 'unknown'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="score-cell">
                        <strong style={{ 
                          fontSize: '1.25rem',
                          color: player.score > 0 ? '#28a745' : player.score < 0 ? '#dc3545' : '#333'
                        }}>
                          {player.score || 0}
                        </strong>
                      </td>
                      <td>{player.gamesPlayed || 0}</td>
                      <td className="win-cell" style={{ fontWeight: 'bold' }}>{player.wins || 0}</td>
                      <td className="loss-cell">{player.losses || 0}</td>
                      <td className="draw-cell">{player.draws || 0}</td>
                      <td className="date-cell" title={player.lastPlayed}>
                        {formatDate(player.lastPlayed)}
                      </td>
                      <td className="win-rate-cell">
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span style={{ 
                            fontWeight: 'bold',
                            color: winRate >= 70 ? '#28a745' : winRate >= 40 ? '#ffc107' : '#dc3545'
                          }}>
                            {winRate}%
                          </span>
                          <div style={{
                            width: '60px',
                            height: '8px',
                            backgroundColor: '#e9ecef',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${winRate}%`,
                              height: '100%',
                              backgroundColor: winRate >= 70 ? '#28a745' : winRate >= 40 ? '#ffc107' : '#dc3545',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="leaderboard-info">
            <h3>Как зарабатываются очки?</h3>
            <div className="points-info">
              <div className="point-item">
                <span className="point-label">Победа:</span>
                <span className="point-value" style={{ color: '#28a745' }}>+1 очко</span>
              </div>
              <div className="point-item">
                <span className="point-label">Ничья:</span>
                <span className="point-value">0 очков</span>
              </div>
              <div className="point-item">
                <span className="point-label">Поражение:</span>
                <span className="point-value" style={{ color: '#dc3545' }}>-1 очко</span>
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#6c757d' }}>
              <p><strong>Новая система очков:</strong></p>
              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                <li>Победа: <span style={{ color: '#28a745', fontWeight: 'bold' }}>+1 очко</span></li>
                <li>Ничья: <span style={{ fontWeight: 'bold' }}>0 очков</span></li>
                <li>Поражение: <span style={{ color: '#dc3545', fontWeight: 'bold' }}>-1 очко</span></li>
              </ul>
              <p style={{ marginTop: '0.5rem' }}>Это мотивирует играть осторожнее и стратегически!</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;