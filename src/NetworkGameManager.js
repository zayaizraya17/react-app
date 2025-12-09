
// Заглушка для NetworkGameManager
export const NetworkGameManager = {
  createRoom: (username) => {
    console.log('Создание комнаты для:', username);
    const roomId = Math.floor(1000 + Math.random() * 9000).toString();
    return {
      success: true,
      room: {
        id: roomId,
        players: [{ id: '1', name: username, symbol: 'X' }],
        status: 'waiting',
        squares: Array(9).fill(null),
        currentPlayer: 'X',
        winner: null
      }
    };
  },
  
  joinRoom: (roomId, username) => {
    console.log('Присоединение к комнате:', roomId, 'пользователь:', username);
    return {
      success: true,
      room: {
        id: roomId,
        players: [
          { id: '1', name: 'Игрок 1', symbol: 'X' },
          { id: '2', name: username, symbol: 'O' }
        ],
        status: 'playing',
        squares: Array(9).fill(null),
        currentPlayer: 'X',
        winner: null
      }
    };
  },
  
  getRoom: (roomId) => {
    // Возвращаем фиктивную комнату для демонстрации
    return {
      id: roomId,
      players: [
        { id: '1', name: 'Игрок 1', symbol: 'X' },
        { id: '2', name: 'Игрок 2', symbol: 'O' }
      ],
      status: 'playing',
      squares: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null
    };
  },
  
  makeMove: (roomId, index, playerId) => {
    console.log('Ход в комнате:', roomId, 'позиция:', index, 'игрок:', playerId);
    // Фиктивный результат хода
    const squares = Array(9).fill(null);
    squares[index] = playerId === '1' ? 'X' : 'O';
    
    // Проверяем выигрыш
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    
    let winner = null;
    for (let line of lines) {
      const [a, b, c] = line;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        winner = squares[a];
        break;
      }
    }
    
    return {
      id: roomId,
      players: [
        { id: '1', name: 'Игрок 1', symbol: 'X' },
        { id: '2', name: 'Игрок 2', symbol: 'O' }
      ],
      status: winner ? 'finished' : 'playing',
      squares: squares,
      currentPlayer: playerId === '1' ? 'O' : 'X',
      winner: winner
    };
  },
  
  leaveRoom: (roomId, playerId) => {
    console.log('Выход из комнаты:', roomId, 'игрок:', playerId);
    return true;
  },
  
  disconnect: () => {
    console.log('Отключение от сетевой игры');
  }
};