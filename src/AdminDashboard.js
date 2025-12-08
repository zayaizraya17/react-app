
import React, { useState, useEffect } from 'react';
import { UserManager } from './userManager';
import { Storage } from './storage';
import AdminUsersTable from './AdminUsersTable';
import AdminGamesTable from './AdminGamesTable';
import AdminStats from './AdminStats';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Получаем реальных пользователей из UserManager
      const allUsers = UserManager.getAllUsers();
      
      // Получаем системную статистику
      const systemStats = UserManager.getSystemStats();
      
      // Подготавливаем данные пользователей для таблицы
      const formattedUsers = allUsers.map(user => {
        const userStats = Storage.getUserStats(user.username);
        const userGames = Storage.getUserGames(user.username);
        
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          isAdmin: user.isAdmin || false,
          createdAt: user.createdAt,
          stats: {
            gamesPlayed: userStats.gamesPlayed || 0,
            gamesWon: userStats.wins || 0,
            gamesLost: userStats.losses || 0,
            gamesDrawn: userStats.draws || 0,
            totalScore: userStats.score || 0,
            winRate: userStats.gamesPlayed > 0 
              ? Math.round((userStats.wins / userStats.gamesPlayed) * 100) 
              : 0
          }
        };
      });
      
      // Собираем все игры из системы
      const allGames = [];
      allUsers.forEach(user => {
        if (!user.isAdmin) {
          const userGames = Storage.getUserGames(user.username);
          userGames.forEach(game => {
            // Добавляем информацию об оппоненте
            const opponentName = game.opponent || 'ИИ';
            const isNetworkGame = game.aiLevel === 'network';
            
            allGames.push({
              id: game.id,
              player1Id: user.id,
              player1Username: user.username,
              player2Id: isNetworkGame ? 'network-player' : 'ai-player',
              player2Username: opponentName,
              winner: game.win === true ? user.id : game.win === false ? 'ai-player' : null,
              result: game.win === true ? 'win' : game.win === false ? 'loss' : 'draw',
              aiLevel: game.aiLevel || 'medium',
              scoreChange: game.score || 0,
              createdAt: game.timestamp,
              duration: Math.floor(Math.random() * 300) + 60, // Генерируем длительность
              squares: game.squares || []
            });
          });
        }
      });
      
      // Сортируем игры по дате
      const sortedGames = allGames.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setUsers(formattedUsers);
      setGames(sortedGames);
      setStats(systemStats);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGames = games.filter(game => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      game.player1Username.toLowerCase().includes(searchLower) ||
      game.player2Username.toLowerCase().includes(searchLower) ||
      game.id.toLowerCase().includes(searchLower)
    );
  });

  const filteredUsers = users.filter(user => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="main-content with-topbar">
        <div className="loading">
          <p>Загрузка административной панели...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content with-topbar">
      <div className="admin-dashboard">
        <div className="admin-header">
          <h1>Панель администратора</h1>
          <p className="admin-subtitle">Управление пользователями и играми</p>
        </div>

        <AdminStats stats={stats} />

        <div className="admin-controls">
          <div className="admin-tabs">
            <button
              className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Пользователи ({users.length})
            </button>
            <button
              className={`admin-tab-btn ${activeTab === 'games' ? 'active' : ''}`}
              onClick={() => setActiveTab('games')}
            >
              Все игры ({games.length})
            </button>
          </div>

          <div className="admin-search">
            <input
              type="text"
              placeholder="Поиск по имени, email или ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-search-input"
            />
            <button 
              className="admin-refresh-btn"
              onClick={loadData}
            >
              Обновить
            </button>
          </div>
        </div>

        <div className="admin-content">
          {activeTab === 'users' ? (
            <AdminUsersTable users={filteredUsers} />
          ) : (
            <AdminGamesTable games={filteredGames} />
          )}
        </div>

        <div className="admin-info">
          <h3>Информация для администратора</h3>
          <ul>
            <li>Администратор не может участвовать в играх</li>
            <li>Вы можете просматривать историю всех игр в системе</li>
            <li>Нажмите на пользователя, чтобы увидеть все его игры</li>
            <li>Используйте поиск для быстрого доступа к данным</li>
            <li>Данные загружаются из localStorage реальных пользователей</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;