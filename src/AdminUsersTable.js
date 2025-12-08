// AdminUsersTable.js в корне src/
import React from 'react';
import { useNavigate } from 'react-router-dom';

function AdminUsersTable({ users }) {
  const navigate = useNavigate();

  const viewUserGames = (userId) => {
    navigate(`/admin/user/${userId}/games`);
  };

  return (
    <div className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Пользователь</th>
            <th>Email</th>
            <th>Имя</th>
            <th>Игр сыграно</th>
            <th>Побед</th>
            <th>Процент побед</th>
            <th>Общий счет</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="admin-table-row">
              <td className="user-id-cell">{user.id}</td>
              <td className="user-info-cell">
                <div className="user-info-admin">
                  <div className="avatar-initials-small">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                  <div className="user-details-admin">
                    <div className="user-username">{user.username}</div>
                    <div className="user-created">
                      {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </div>
              </td>
              <td className="user-email-cell">{user.email}</td>
              <td className="user-name-cell">{user.firstName} {user.lastName}</td>
              <td className="user-games-cell">{user.stats.gamesPlayed}</td>
              <td className="user-wins-cell">{user.stats.gamesWon}</td>
              <td className="user-winrate-cell">
                <div className="winrate-bar">
                  <div 
                    className="winrate-fill"
                    style={{ width: `${user.stats.winRate}%` }}
                  ></div>
                  <span className="winrate-text">{user.stats.winRate}%</span>
                </div>
              </td>
              <td className="user-score-cell">
                <span className={user.stats.totalScore >= 0 ? 'positive-score' : 'negative-score'}>
                  {user.stats.totalScore}
                </span>
              </td>
              <td className="user-actions-cell">
                <button 
                  onClick={() => viewUserGames(user.id)}
                  className="view-games-btn"
                >
                  Просмотреть игры
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <div className="no-data-message">
          <p>Пользователи не найдены</p>
        </div>
      )}
    </div>
  );
}

export default AdminUsersTable;