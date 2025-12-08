// components/admin/AdminGamesTable.js
import React from 'react';

function AdminGamesTable({ games }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID игры</th>
            <th>Игрок 1</th>
            <th>Игрок 2</th>
            <th>Победитель</th>
            <th>Уровень AI</th>
            <th>Счет</th>
            <th>Длительность</th>
            <th>Дата</th>
          </tr>
        </thead>
        <tbody>
          {games.map(game => (
            <tr key={game.id} className="admin-table-row">
              <td className="game-id-cell">{game.id}</td>
              <td className="player-cell">
                <span className="player-name">{game.player1Username}</span>
              </td>
              <td className="player-cell">
                <span className="player-name">{game.player2Username}</span>
              </td>
              <td className="winner-cell">
                {game.winner ? (
                  <span className={`winner-badge ${game.winner === game.player1Id ? 'player1' : 'player2'}`}>
                    {game.winner === game.player1Id ? game.player1Username : game.player2Username}
                  </span>
                ) : (
                  <span className="draw-badge">Ничья</span>
                )}
              </td>
              <td className="ai-level-cell">
                <span className={`level-indicator ${game.aiLevel}`}>
                  {game.aiLevel}
                </span>
              </td>
              <td className="score-change-cell">
                <span className={game.scoreChange >= 0 ? 'positive-score' : 'negative-score'}>
                  {game.scoreChange >= 0 ? '+' : ''}{game.scoreChange}
                </span>
              </td>
              <td className="duration-cell">
                {formatDuration(game.duration)}
              </td>
              <td className="date-cell">
                {formatDate(game.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {games.length === 0 && (
        <div className="no-data-message">
          <p>Игры не найдены</p>
        </div>
      )}
    </div>
  );
}

export default AdminGamesTable;