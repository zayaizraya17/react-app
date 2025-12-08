// NetworkGameManager.js
export const NetworkGameManager = {
  // Ключи для localStorage
  KEYS: {
    ROOMS: 'tic-tac-toe_rooms',
    CURRENT_ROOM: 'tic-tac-toe_current_room',
    PLAYER_ID: 'tic-tac-toe_player_id'
  },

  // Генерация ID игрока
  generatePlayerId() {
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(this.KEYS.PLAYER_ID, playerId);
    return playerId;
  },

  getPlayerId() {
    return localStorage.getItem(this.KEYS.PLAYER_ID) || this.generatePlayerId();
  },

  // Создать комнату
  createRoom(playerName, playerId = null) {
    const rooms = this.getAllRooms();
    const roomId = Math.floor(1000 + Math.random() * 9000).toString();
    
    const player = {
      id: playerId || this.getPlayerId(),
      name: playerName,
      symbol: 'X',
      isReady: true
    };

    const room = {
      id: roomId,
      status: 'waiting', // waiting, playing, finished
      players: [player],
      currentPlayer: 'X',
      squares: Array(9).fill(null),
      winner: null,
      createdAt: new Date().toISOString(),
      creator: playerName,
      lastActivity: Date.now()
    };

    rooms[roomId] = room;
    localStorage.setItem(this.KEYS.ROOMS, JSON.stringify(rooms));
    localStorage.setItem(this.KEYS.CURRENT_ROOM, JSON.stringify({ roomId, player }));

    return { success: true, roomId, room };
  },

  // Присоединиться к комнате
  joinRoom(roomId, playerName, playerId = null) {
    const rooms = this.getAllRooms();
    const room = rooms[roomId];

    if (!room) {
      return { success: false, message: 'Комната не найдена' };
    }

    if (room.status !== 'waiting') {
      return { success: false, message: 'Игра уже началась' };
    }

    if (room.players.length >= 2) {
      return { success: false, message: 'Комната заполнена' };
    }

    const player = {
      id: playerId || this.getPlayerId(),
      name: playerName,
      symbol: 'O',
      isReady: true
    };

    room.players.push(player);
    room.status = 'playing';
    room.lastActivity = Date.now();
    
    rooms[roomId] = room;
    localStorage.setItem(this.KEYS.ROOMS, JSON.stringify(rooms));
    localStorage.setItem(this.KEYS.CURRENT_ROOM, JSON.stringify({ roomId, player }));

    return { success: true, room };
  },

  // Получить комнату
  getRoom(roomId) {
    const rooms = this.getAllRooms();
    return rooms[roomId] || null;
  },

  // Получить все комнаты
  getAllRooms() {
    try {
      const roomsJson = localStorage.getItem(this.KEYS.ROOMS);
      return roomsJson ? JSON.parse(roomsJson) : {};
    } catch {
      return {};
    }
  },

  // Обновить состояние комнаты
  updateRoom(roomId, updates) {
    const rooms = this.getAllRooms();
    if (!rooms[roomId]) return null;

    rooms[roomId] = {
      ...rooms[roomId],
      ...updates,
      lastActivity: Date.now()
    };

    localStorage.setItem(this.KEYS.ROOMS, JSON.stringify(rooms));
    return rooms[roomId];
  },

  // Сделать ход
  makeMove(roomId, index, playerId) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player || room.currentPlayer !== player.symbol) return null;

    if (room.squares[index] || room.winner || room.status !== 'playing') {
      return null;
    }

    const newSquares = [...room.squares];
    newSquares[index] = player.symbol;

    const winner = this.calculateWinner(newSquares);
    const status = winner ? 'finished' : 'playing';
    const nextPlayer = player.symbol === 'X' ? 'O' : 'X';

    const updatedRoom = this.updateRoom(roomId, {
      squares: newSquares,
      currentPlayer: nextPlayer,
      winner: winner,
      status: status
    });

    // Сохраняем игру в историю если она завершена
    if (status === 'finished') {
      this.saveGameToHistory(roomId, updatedRoom);
    }

    return updatedRoom;
  },

  // Выйти из комнаты
  leaveRoom(roomId, playerId) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;

    // Определяем победителя (оппонент)
    const opponent = room.players.find(p => p.id !== playerId);
    
    const updatedRoom = this.updateRoom(roomId, {
      status: 'finished',
      winner: opponent ? opponent.symbol : null,
      leaveReason: `Игрок ${player.name} покинул игру`
    });

    // Сохраняем в историю
    this.saveGameToHistory(roomId, updatedRoom);

    // Удаляем комнату если она пустая или игра завершена
    setTimeout(() => this.cleanupEmptyRooms(), 1000);

    return updatedRoom;
  },

  // Удалить комнату
  deleteRoom(roomId) {
    const rooms = this.getAllRooms();
    delete rooms[roomId];
    localStorage.setItem(this.KEYS.ROOMS, JSON.stringify(rooms));
    localStorage.removeItem(this.KEYS.CURRENT_ROOM);
  },

  // Очистка старых комнат
  cleanupEmptyRooms() {
    const rooms = this.getAllRooms();
    const now = Date.now();
    const hour = 60 * 60 * 1000;

    Object.keys(rooms).forEach(roomId => {
      const room = rooms[roomId];
      if (room.status === 'finished' || (now - room.lastActivity > hour)) {
        delete rooms[roomId];
      }
    });

    localStorage.setItem(this.KEYS.ROOMS, JSON.stringify(rooms));
  },

  // Сохранить игру в историю
  saveGameToHistory(roomId, room) {
    if (room.status !== 'finished') return;

    try {
      const history = JSON.parse(localStorage.getItem('tic-tac-toe_network_history') || '[]');
      
      const gameRecord = {
        id: roomId,
        timestamp: new Date().toISOString(),
        players: room.players.map(p => ({
          name: p.name,
          symbol: p.symbol,
          isWinner: room.winner === p.symbol
        })),
        squares: room.squares,
        winner: room.winner,
        leaveReason: room.leaveReason,
        type: 'network'
      };

      history.unshift(gameRecord);
      localStorage.setItem('tic-tac-toe_network_history', JSON.stringify(history.slice(0, 50))); // Храним 50 последних игр
    } catch (error) {
      console.error('Error saving game to history:', error);
    }
  },

  // Получить историю сетевых игр
  getNetworkHistory(username = null) {
    try {
      const history = JSON.parse(localStorage.getItem('tic-tac-toe_network_history') || '[]');
      
      if (username) {
        return history.filter(game => 
          game.players.some(p => p.name === username)
        );
      }
      
      return history;
    } catch {
      return [];
    }
  },

  // Проверка победителя
  calculateWinner(squares) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    
    if (!squares.includes(null)) {
      return 'draw';
    }
    
    return null;
  },

  // Получить текущую комнату игрока
  getCurrentRoom() {
    try {
      const currentRoomJson = localStorage.getItem(this.KEYS.CURRENT_ROOM);
      return currentRoomJson ? JSON.parse(currentRoomJson) : null;
    } catch {
      return null;
    }
  },

  // Отписаться от комнаты
  disconnect() {
    localStorage.removeItem(this.KEYS.CURRENT_ROOM);
  },

  // Проверить доступность комнаты
  checkRoomAvailability(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return { available: false, message: 'Комната не найдена' };
    
    if (room.status !== 'waiting') {
      return { available: false, message: 'Игра уже началась' };
    }
    
    if (room.players.length >= 2) {
      return { available: false, message: 'Комната заполнена' };
    }
    
    return { available: true };
  }
};