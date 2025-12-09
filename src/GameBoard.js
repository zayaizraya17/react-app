
// GameBoard.js - обновленная версия с Firebase
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AI, getGameResult } from './gameLogic';
import { useAuth } from './AuthContext';
import { NetworkGameManager } from './NetworkGameManager';
import GameModeSelector from './GameModeSelector';
import { saveGameResult } from './firebase'; 

const GameBoard = () => {
  const { currentUser } = useAuth();
  const [gameMode, setGameMode] = useState(null); // null, 'ai', 'network'
  const [networkRoom, setNetworkRoom] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  
  // Состояния для игры с ИИ
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('Выберите режим игры');
  const [aiLevel, setAiLevel] = useState('medium');
  const [score, setScore] = useState({
    player: 0,
    ai: 0,
    draws: 0
  });
  const [isThinking, setIsThinking] = useState(false);
  
  const aiLevelRef = useRef(aiLevel);

  useEffect(() => {
    aiLevelRef.current = aiLevel;
  }, [aiLevel]);

  // Загрузка статистики из Firebase (если нужно)
  useEffect(() => {
    if (currentUser) {
      // Пока используем локальное состояние
      // Позже можно загружать из Firebase
      setScore({
        player: 0,
        ai: 0,
        draws: 0
      });
    }
  }, [currentUser]);

  // Для сетевой игры
  const [networkPolling, setNetworkPolling] = useState(null);

  // Запуск сетевой игры
  const startNetworkGame = useCallback((roomId, isCreator = false) => {
    if (!currentUser) return;
    
    let room;
    if (isCreator) {
      const result = NetworkGameManager.createRoom(currentUser.username);
      if (!result.success) {
        alert(result.message);
        return;
      }
      room = result.room;
    } else {
      const result = NetworkGameManager.joinRoom(roomId, currentUser.username);
      if (!result.success) {
        alert(result.message);
        return;
      }
      room = result.room;
    }
    
    setNetworkRoom(room);
    setGameMode('network');
    setCurrentPlayer(room.players.find(p => p.name === currentUser.username));
    
    // Начинаем опрос состояния комнаты
    const pollInterval = setInterval(() => {
      const updatedRoom = NetworkGameManager.getRoom(room.id);
      if (updatedRoom) {
        setNetworkRoom(updatedRoom);
        
        // Обновляем состояние игры
        if (updatedRoom.status === 'playing') {
          setSquares(updatedRoom.squares);
          setWinner(updatedRoom.winner);
          setGameOver(updatedRoom.status === 'finished');
          
          if (updatedRoom.winner) {
            const playerSymbol = currentPlayer.symbol;
            if (updatedRoom.winner === playerSymbol) {
              setMessage('🎉 Вы победили!');
            } else if (updatedRoom.winner === 'draw') {
              setMessage('🤝 Ничья!');
            } else {
              setMessage('😞 Вы проиграли');
            }
          } else {
            const isMyTurn = updatedRoom.currentPlayer === currentPlayer.symbol;
            setMessage(isMyTurn ? '🎮 Ваш ход' : '⏳ Ход противника...');
          }
        }
      }
    }, 1000);
    
    setNetworkPolling(pollInterval);
    
    setMessage(isCreator 
      ? `Комната создана! ID: ${room.id}. Ожидаем противника...`
      : `Вы присоединились к комнате ${roomId}. Ожидаем начала игры...`
    );
  }, [currentUser]);

  // Сделать ход в сетевой игре
  const makeNetworkMove = useCallback((index) => {
    if (!networkRoom || !currentPlayer || gameOver) return;
    
    if (networkRoom.currentPlayer !== currentPlayer.symbol) {
      setMessage('Сейчас не ваш ход!');
      return;
    }
    
    const updatedRoom = NetworkGameManager.makeMove(networkRoom.id, index, currentPlayer.id);
    if (updatedRoom) {
      setNetworkRoom(updatedRoom);
      setSquares(updatedRoom.squares);
      
      if (updatedRoom.winner) {
        setWinner(updatedRoom.winner);
        setGameOver(true);
        
        // Сохраняем результат игры в Firebase
        if (currentUser) {
          const playerSymbol = currentPlayer.symbol;
          const win = updatedRoom.winner === playerSymbol;
          const draw = updatedRoom.winner === 'draw';
          const scoreValue = win ? 1 : (draw ? 0 : -1);
          
          // Сохраняем в Firebase
          saveGameResult(
            currentUser.id,
            currentUser.username,
            win,
            scoreValue,
            'network'
          ).then(result => {
            if (result.success) {
              console.log('Игра сохранена в Firebase');
            } else {
              console.error('Ошибка сохранения игры:', result.message);
            }
          });
        }
      }
    }
  }, [networkRoom, currentPlayer, gameOver, currentUser]);

  // Покинуть сетевую игру
  const leaveNetworkGame = useCallback(() => {
    if (networkRoom && currentPlayer) {
      NetworkGameManager.leaveRoom(networkRoom.id, currentPlayer.id);
      
      // Уведомляем о победе оппонента
      if (networkRoom.status === 'playing') {
        const opponent = networkRoom.players.find(p => p.id !== currentPlayer.id);
        if (opponent) {
          // Сохраняем поражение для текущего игрока в Firebase
          if (currentUser) {
            saveGameResult(
              currentUser.id,
              currentUser.username,
              false,
              -1,
              'network'
            ).then(result => {
              if (result.success) {
                console.log('Результат покидания игры сохранен в Firebase');
              }
            });
          }
        }
      }
    }
    
    // Очищаем состояние
    if (networkPolling) {
      clearInterval(networkPolling);
      setNetworkPolling(null);
    }
    
    NetworkGameManager.disconnect();
    setNetworkRoom(null);
    setCurrentPlayer(null);
    setGameMode(null);
    setMessage('Вы вышли из сетевой игры');
    resetGame();
  }, [networkRoom, currentPlayer, networkPolling, currentUser]);

  // Функции для игры с ИИ
  const checkAndSaveGameResult = useCallback(async (currentSquares) => {
    const result = getGameResult(currentSquares, 'X');
    
    if (result.result === 'draw' || result.result === 'win' || result.result === 'loss') {
      setWinner(result.result === 'win' ? 'X' : result.result === 'loss' ? 'O' : 'draw');
      setMessage(result.message);
      setGameOver(true);
      
      setScore(prev => ({
        ...prev,
        player: result.result === 'win' ? prev.player + 1 : prev.player,
        ai: result.result === 'loss' ? prev.ai + 1 : prev.ai,
        draws: result.result === 'draw' ? prev.draws + 1 : prev.draws
      }));
      
      // Сохраняем результат игры в Firebase
      if (currentUser) {
        try {
          await saveGameResult(
            currentUser.id,
            currentUser.username,
            result.win,
            result.score,
            aiLevelRef.current
          );
          console.log('Игра сохранена в Firebase');
        } catch (error) {
          console.error('Ошибка сохранения игры в Firebase:', error);
        }
      }
      
      return true;
    }
    
    return false;
  }, [currentUser]);

  const makeAiMove = useCallback(() => {
    if (gameOver || gameMode !== 'ai') return;
    
    let aiMove;
    switch (aiLevelRef.current) {
      case 'easy':
        aiMove = AI.easy(squares);
        break;
      case 'medium':
        aiMove = AI.medium(squares);
        break;
      case 'hard':
        aiMove = AI.hard(squares);
        break;
      default:
        aiMove = AI.medium(squares);
    }
    
    if (aiMove !== null) {
      const newSquares = [...squares];
      newSquares[aiMove] = 'O';
      setSquares(newSquares);
      
      const gameEnded = checkAndSaveGameResult(newSquares);
      
      if (!gameEnded) {
        setIsXNext(true);
      }
    }
  }, [squares, gameOver, gameMode, checkAndSaveGameResult]);

  const handleClick = (i) => {
    if (gameMode === 'ai') {
      // Игра с ИИ
      if (squares[i] || !isXNext || gameOver || isThinking) return;
      
      const newSquares = [...squares];
      newSquares[i] = 'X';
      setSquares(newSquares);
      
      const gameEnded = checkAndSaveGameResult(newSquares);
      
      if (!gameEnded && newSquares.some(sq => sq === null)) {
        setIsXNext(false);
      }
    } else if (gameMode === 'network') {
      // Сетевая игра
      makeNetworkMove(i);
    }
  };

  const resetGame = () => {
    setSquares(Array(9).fill(null));
    setWinner(null);
    setGameOver(false);
    setIsXNext(true);
    setIsThinking(false);
    
    if (gameMode === 'ai') {
      setMessage('Ваш ход (X)');
    }
  };

  const startAiGame = () => {
    setGameMode('ai');
    resetGame();
    setMessage('Ваш ход (X)');
  };

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (networkPolling) {
        clearInterval(networkPolling);
      }
    };
  }, [networkPolling]);

  // Рендер квадрата
  const renderSquare = (i) => {
    const squareValue = gameMode === 'network' ? squares[i] : squares[i];
    let isDisabled = false;
    
    if (gameMode === 'ai') {
      isDisabled = squareValue || !isXNext || gameOver || isThinking;
    } else if (gameMode === 'network') {
      isDisabled = squareValue || gameOver || 
                  !networkRoom || 
                  networkRoom.currentPlayer !== currentPlayer?.symbol;
    }
    
    return (
      <button
        className={`square ${squareValue || ''}`}
        onClick={() => handleClick(i)}
        disabled={isDisabled}
        style={{
          width: '100px',
          height: '100px',
          flex: '0 0 100px',
          margin: '0',
          padding: '0',
          fontSize: '2.5rem',
          fontWeight: 'bold',
          transition: 'all 0.2s ease'
        }}
      >
        {squareValue}
      </button>
    );
  };

  // Ход ИИ
  useEffect(() => {
    if (gameMode === 'ai' && !isXNext && !gameOver && !isThinking && squares.some(sq => sq === null)) {
      setIsThinking(true);
      
      setTimeout(() => {
        makeAiMove();
        setIsThinking(false);
      }, 500);
    }
  }, [isXNext, gameOver, isThinking, squares, gameMode, makeAiMove]);

  // Обновление сообщения
  useEffect(() => {
    if (gameMode === 'ai' && !gameOver) {
      if (isThinking) {
        setMessage('🤔 ИИ думает...');
      } else if (isXNext) {
        setMessage('🎮 Ваш ход (X)');
      } else {
        setMessage('⏳ Ход ИИ (O)...');
      }
    }
  }, [isXNext, isThinking, gameOver, gameMode]);

  if (!gameMode) {
    return <GameModeSelector onSelectMode={setGameMode} onStartNetworkGame={startNetworkGame} />;
  }

  return (
    <div className="game-page">
      <div className="game-header">
        <h2>
          {gameMode === 'ai' ? 'Игра с ИИ' : 'Сетевая игра'}
          {networkRoom && ` (Комната: ${networkRoom.id})`}
        </h2>
        
        <div className="game-stats">
          {gameMode === 'ai' && (
            <>
              <div className="stat">
                <span className="stat-label">Ваши победы:</span>
                <span className="stat-value">{score.player}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Победы ИИ:</span>
                <span className="stat-value">{score.ai}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Ничьи:</span>
                <span className="stat-value">{score.draws}</span>
              </div>
            </>
          )}
          
          {gameMode === 'network' && networkRoom && (
            <div className="network-info">
              <div className="players">
                {networkRoom.players.map((player, idx) => (
                  <div key={player.id} className="player-info">
                    <span className={`player-badge ${player.symbol}`}>
                      {player.name} ({player.symbol})
                      {player.id === currentPlayer?.id && ' (Вы)'}
                    </span>
                    {idx === 0 && <span className="vs">VS</span>}
                  </div>
                ))}
              </div>
              <div className="room-status">
                Статус: {networkRoom.status === 'waiting' ? 'Ожидание' : 
                        networkRoom.status === 'playing' ? 'Игра' : 'Завершено'}
              </div>
            </div>
          )}
        </div>
      </div>

      {gameMode === 'ai' && (
        <div className="game-controls">
          <div className="ai-level-selector">
            <label>Уровень сложности ИИ:</label>
            <div className="level-buttons">
              {['easy', 'medium', 'hard'].map((level) => (
                <button
                  key={level}
                  className={`level-btn ${aiLevel === level ? 'active' : ''}`}
                  onClick={() => setAiLevel(level)}
                  disabled={!isXNext || isThinking}
                >
                  {level === 'easy' ? 'Легкий' : level === 'medium' ? 'Средний' : 'Сложный'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="game-status">
        <div className={`status-message ${gameOver ? 'game-over' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
            {isThinking && '🤔'}
            {gameOver && (winner === 'X' ? '🎉' : winner === 'O' ? '😞' : '🤝')}
            {!gameOver && !isThinking && (isXNext ? '🎮' : '🤖')}
            <span>{message}</span>
          </div>
        </div>
      </div>

      <div className="game-board">
        {[0, 3, 6].map((startIndex) => (
          <div key={startIndex} className="board-row">
            {[0, 1, 2].map((offset) => renderSquare(startIndex + offset))}
          </div>
        ))}
      </div>

      <div className="game-actions">
        <button className="reset-btn" onClick={resetGame} disabled={isThinking}>
          Новая игра
        </button>
        
        {gameMode === 'network' && (
          <button className="leave-btn" onClick={leaveNetworkGame}>
            🚪 Покинуть игру
          </button>
        )}
        
        <button className="mode-btn" onClick={() => {
          if (gameMode === 'network') {
            leaveNetworkGame();
          }
          setGameMode(null);
        }}>
          🔄 Сменить режим
        </button>
      </div>
    </div>
  );
};

export default GameBoard;
