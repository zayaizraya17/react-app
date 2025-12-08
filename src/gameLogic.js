
export const AI = {
  // Простой рандомный ИИ
  easy: (squares) => {
    const emptySquares = squares
      .map((square, index) => square === null ? index : null)
      .filter(val => val !== null);
    
    if (emptySquares.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * emptySquares.length);
    return emptySquares[randomIndex];
  },

  // ИИ средней сложности (блокирует выигрышные ходы)
  medium: (squares) => {
    // Сначала проверяем, можем ли выиграть
    const winningMove = AI.findWinningMove(squares, 'O');
    if (winningMove !== null) return winningMove;
    
    // Блокируем выигрышный ход противника
    const blockingMove = AI.findWinningMove(squares, 'X');
    if (blockingMove !== null) return blockingMove;
    
    // Иначе случайный ход
    return AI.easy(squares);
  },

  // Сложный ИИ (минимакс алгоритм)
  hard: (squares) => {
    const emptySquares = squares
      .map((square, index) => square === null ? index : null)
      .filter(val => val !== null);
    
    // Если поле пустое, ходим в центр или угол
    if (emptySquares.length === 9) {
      return [4, 0, 2, 6, 8][Math.floor(Math.random() * 5)];
    }
    
    // Используем алгоритм минимакс
    const bestMove = AI.minimax(squares, 'O').index;
    return bestMove;
  },

  // Вспомогательная функция для поиска выигрышного хода
  findWinningMove: (squares, player) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      const squaresInLine = [squares[a], squares[b], squares[c]];
      
      // Если две клетки заняты игроком и одна пустая
      if (
        squaresInLine.filter(sq => sq === player).length === 2 &&
        squaresInLine.includes(null)
      ) {
        // Возвращаем индекс пустой клетки
        if (squares[a] === null) return a;
        if (squares[b] === null) return b;
        if (squares[c] === null) return c;
      }
    }
    
    return null;
  },

  // Алгоритм минимакс для оптимальной игры
  minimax: (newSquares, player) => {
    // Проверяем состояние игры
    const winner = calculateWinner(newSquares);
    if (winner === 'O') return { score: 10 };
    if (winner === 'X') return { score: -10 };
    if (!newSquares.includes(null)) return { score: 0 };

    const moves = [];
    
    // Перебираем все возможные ходы
    for (let i = 0; i < newSquares.length; i++) {
      if (newSquares[i] === null) {
        const move = {};
        move.index = i;
        
        // Делаем ход
        newSquares[i] = player;
        
        // Рекурсивно вызываем минимакс для противоположного игрока
        if (player === 'O') {
          const result = AI.minimax(newSquares, 'X');
          move.score = result.score;
        } else {
          const result = AI.minimax(newSquares, 'O');
          move.score = result.score;
        }
        
        // Отменяем ход
        newSquares[i] = null;
        moves.push(move);
      }
    }

    // Выбираем лучший ход
    let bestMove;
    if (player === 'O') {
      let bestScore = -Infinity;
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].score > bestScore) {
          bestScore = moves[i].score;
          bestMove = i;
        }
      }
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].score < bestScore) {
          bestScore = moves[i].score;
          bestMove = i;
        }
      }
    }

    return moves[bestMove];
  }
};

// Функция определения победителя
export const calculateWinner = (squares) => {
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
  
  // Проверяем на ничью
  if (!squares.includes(null)) {
    return 'draw';
  }
  
  return null;
};

// Определение типа игры (кто победил)
// Определение типа игры (кто победил)
export const getGameResult = (squares, playerSymbol = 'X') => {
  const winner = calculateWinner(squares);
  console.log('getGameResult проверка:', { squares, winner, playerSymbol });

  // Сначала проверяем ничью - это приоритет
  if (winner === 'draw') {
    return {
      win: null,
      result: 'draw',
      message: 'Ничья!',
      score: 0
    };
  }
  
  // Затем проверяем, есть ли победитель
  if (winner) {
    // Если есть победитель, проверяем кто это
    if (winner === playerSymbol) {
      return {
        win: true,
        result: 'win',
        message: 'Вы победили!',
        score: 1  // За победу +1 очко
      };
    } else {
      // Победил не игрок (значит ИИ - 'O')
      return {
        win: false,
        result: 'loss',
        message: 'ИИ победил!',
        score: -1  // За поражение -1 очко
      };
    }
  }
  
  // Игра еще не окончена
  return {
    win: undefined,
    result: 'continue',
    message: '',
    score: 0
  };
};