import React from 'react';

function AdminStats({ stats }) {
  if (!stats) return null;

  return (
    <div className="admin-stats-grid">
      <div className="admin-stat-card">
        <div className="admin-stat-icon">👥</div>
        <div className="admin-stat-content">
          <div className="admin-stat-value">{stats.totalUsers}</div>
          <div className="admin-stat-label">Всего пользователей</div>
        </div>
      </div>
      <div className="admin-stat-card">
        <div className="admin-stat-icon">🎮</div>
        <div className="admin-stat-content">
          <div className="admin-stat-value">{stats.totalGames}</div>
          <div className="admin-stat-label">Всего игр</div>
        </div>
      </div>
      <div className="admin-stat-card">
        <div className="admin-stat-icon">🔥</div>
        <div className="admin-stat-content">
          <div className="admin-stat-value">{stats.activeUsers}</div>
          <div className="admin-stat-label">Активных игроков</div>
        </div>
      </div>
      <div className="admin-stat-card">
        <div className="admin-stat-icon">📊</div>
        <div className="admin-stat-content">
          <div className="admin-stat-value">{stats.averageWinRate}%</div>
          <div className="admin-stat-label">Средний процент побед</div>
        </div>
      </div>
      <div className="admin-stat-card">
        <div className="admin-stat-icon">⭐</div>
        <div className="admin-stat-content">
          <div className="admin-stat-value">{stats.totalScore}</div>
          <div className="admin-stat-label">Общий счет системы</div>
        </div>
      </div>
    </div>
  );
}

export default AdminStats;