// GameModeSelector.js
import React, { useState } from 'react';

const GameModeSelector = ({ onSelectMode, onStartNetworkGame }) => {
  const [mode, setMode] = useState('ai'); // 'ai', 'network'
  const [roomId, setRoomId] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [networkMessage, setNetworkMessage] = useState('');

  const handleStartGame = () => {
    if (mode === 'ai') {
      onSelectMode('ai');
    } else if (mode === 'network') {
      if (creatingRoom) {
        onStartNetworkGame(null, true);
      } else if (roomId.trim()) {
        onStartNetworkGame(roomId.trim(), false);
      } else {
        setNetworkMessage('Введите номер комнаты');
      }
    }
  };

  return (
    <div className="mode-selector">
      <div className="mode-header">
        <h2>🎮 Выберите режим игры</h2>
        <p>Сыграйте с ИИ или с другим игроком по сети</p>
      </div>

      <div className="mode-options">
        <div className="mode-option">
          <input
            type="radio"
            id="mode-ai"
            name="game-mode"
            checked={mode === 'ai'}
            onChange={() => setMode('ai')}
          />
          <label htmlFor="mode-ai" className="mode-label">
            <div className="mode-icon">🤖</div>
            <div className="mode-content">
              <h3>Игра с ИИ</h3>
              <p>Сыграйте против искусственного интеллекта разных уровней сложности</p>
            </div>
          </label>
        </div>

        <div className="mode-option">
          <input
            type="radio"
            id="mode-network"
            name="game-mode"
            checked={mode === 'network'}
            onChange={() => setMode('network')}
          />
          <label htmlFor="mode-network" className="mode-label">
            <div className="mode-icon">🌐</div>
            <div className="mode-content">
              <h3>Сетевая игра</h3>
              <p>Сыграйте с другим игроком через браузер</p>
            </div>
          </label>
        </div>
      </div>

      {mode === 'network' && (
        <div className="network-setup">
          <div className="network-options">
            <div className="network-option">
              <input
                type="radio"
                id="create-room"
                name="network-mode"
                checked={creatingRoom}
                onChange={() => setCreatingRoom(true)}
              />
              <label htmlFor="create-room" className="network-label">
                <div className="network-icon">➕</div>
                <div className="network-content">
                  <h4>Создать комнату</h4>
                  <p>Создайте новую комнату и пригласите друга</p>
                </div>
              </label>
            </div>

            <div className="network-option">
              <input
                type="radio"
                id="join-room"
                name="network-mode"
                checked={!creatingRoom}
                onChange={() => setCreatingRoom(false)}
              />
              <label htmlFor="join-room" className="network-label">
                <div className="network-icon">🔗</div>
                <div className="network-content">
                  <h4>Присоединиться</h4>
                  <p>Введите номер комнаты, чтобы присоединиться</p>
                </div>
              </label>
            </div>
          </div>

          {!creatingRoom && (
            <div className="room-input">
              <input
                type="text"
                placeholder="Введите номер комнаты (4 цифры)"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
              />
              <p className="input-hint">Пример: 1234</p>
            </div>
          )}

          {networkMessage && (
            <div className="network-message">{networkMessage}</div>
          )}

          <div className="network-instructions">
            <h4>Как играть по сети:</h4>
            <ol>
              <li>Игрок 1: Создайте комнату → Запомните номер комнаты</li>
              <li>Игрок 2: Введите номер комнаты → Присоединяйтесь</li>
              <li>Начинайте игру! Крестики ходят первыми</li>
            </ol>
          </div>
        </div>
      )}

      <div className="mode-actions">
        <button className="start-btn" onClick={handleStartGame}>
          {mode === 'ai' ? 'Играть с ИИ' : 
           creatingRoom ? 'Создать комнату' : 'Присоединиться'}
        </button>
        
        <button className="back-btn" onClick={() => window.history.back()}>
          Назад
        </button>
      </div>
    </div>
  );
};

export default GameModeSelector;