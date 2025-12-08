// services/authService.js - Обновляем сервис аутентификации
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Предустановленный админ
const ADMIN_USER = {
  id: 'admin-001',
  username: 'Admin',
  email: 'admin@tic-tac-toe.com',
  firstName: 'Системный',
  lastName: 'Администратор',
  isAdmin: true,
  avatar: null,
  createdAt: new Date('2024-01-01').toISOString()
};

// Фейковые пользователи для демонстрации
const FAKE_USERS = [
  {
    id: 'user-001',
    username: 'player1',
    email: 'player1@example.com',
    firstName: 'Иван',
    lastName: 'Иванов',
    isAdmin: false,
    avatar: null,
    createdAt: new Date('2024-01-15').toISOString(),
    stats: {
      gamesPlayed: 42,
      gamesWon: 24,
      gamesLost: 15,
      gamesDrawn: 3,
      totalScore: 156,
      winRate: 57
    }
  },
  {
    id: 'user-002',
    username: 'player2',
    email: 'player2@example.com',
    firstName: 'Мария',
    lastName: 'Петрова',
    isAdmin: false,
    avatar: null,
    createdAt: new Date('2024-01-20').toISOString(),
    stats: {
      gamesPlayed: 28,
      gamesWon: 18,
      gamesLost: 8,
      gamesDrawn: 2,
      totalScore: 98,
      winRate: 64
    }
  },
  {
    id: 'user-003',
    username: 'pro_player',
    email: 'pro@example.com',
    firstName: 'Алексей',
    lastName: 'Сидоров',
    isAdmin: false,
    avatar: null,
    createdAt: new Date('2024-01-10').toISOString(),
    stats: {
      gamesPlayed: 87,
      gamesWon: 65,
      gamesLost: 18,
      gamesDrawn: 4,
      totalScore: 289,
      winRate: 75
    }
  }
];

// Фейковые игры для демонстрации
const generateFakeGames = () => {
  const games = [];
  const players = [...FAKE_USERS, ADMIN_USER];
  const results = ['win', 'loss', 'draw'];
  const aiLevels = ['easy', 'medium', 'hard'];
  const dates = [
    new Date('2024-02-15'),
    new Date('2024-02-14'),
    new Date('2024-02-13'),
    new Date('2024-02-12'),
    new Date('2024-02-11'),
    new Date('2024-02-10'),
    new Date('2024-02-09'),
    new Date('2024-02-08'),
    new Date('2024-02-07'),
    new Date('2024-02-06')
  ];

  for (let i = 0; i < 50; i++) {
    const player1 = players[Math.floor(Math.random() * players.length)];
    const player2 = players[Math.floor(Math.random() * players.length)];
    
    // Админ не играет
    if (player1.isAdmin || player2.isAdmin) continue;
    
    const result = results[Math.floor(Math.random() * results.length)];
    const aiLevel = aiLevels[Math.floor(Math.random() * aiLevels.length)];
    const date = dates[Math.floor(Math.random() * dates.length)];
    
    games.push({
      id: `game-${i + 1}`,
      player1Id: player1.id,
      player1Username: player1.username,
      player2Id: player2.id,
      player2Username: player2.username,
      winner: result === 'win' ? player1.id : result === 'loss' ? player2.id : null,
      result,
      aiLevel,
      scoreChange: Math.floor(Math.random() * 30) - 10,
      createdAt: date.toISOString(),
      duration: Math.floor(Math.random() * 300) + 60 // 1-5 минут
    });
  }
  
  return games.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const FAKE_GAMES = generateFakeGames();

export const authService = {
  async login(username, password) {
    // Эмуляция задержки сети
    await new Promise(resolve => setTimeout(resolve, 500));

    // Проверка учетных данных админа
    if (username === 'Admin' && password === 'Admin') {
      return {
        success: true,
        user: ADMIN_USER,
        token: 'admin-token-12345'
      };
    }

    // Проверка обычных пользователей
    const user = FAKE_USERS.find(u => 
      u.username === username || u.email === username
    );

    if (user) {
      // В реальном приложении здесь была бы проверка пароля
      return {
        success: true,
        user: { ...user },
        token: `user-token-${user.id}`
      };
    }

    return {
      success: false,
      message: 'Неверные учетные данные'
    };
  },

  async register(userData) {
    await new Promise(resolve => setTimeout(resolve, 500));

    // Проверка существующего пользователя
    const existingUser = FAKE_USERS.find(u => 
      u.username === userData.username || u.email === userData.email
    );

    if (existingUser) {
      return {
        success: false,
        message: 'Пользователь с таким именем или email уже существует'
      };
    }

    const newUser = {
      id: `user-${Date.now()}`,
      ...userData,
      isAdmin: false,
      createdAt: new Date().toISOString(),
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        gamesDrawn: 0,
        totalScore: 0,
        winRate: 0
      }
    };

    FAKE_USERS.push(newUser);

    return {
      success: true,
      user: newUser,
      token: `user-token-${newUser.id}`
    };
  },

  async getAllUsers() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...FAKE_USERS].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  },

  async getAllGames() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...FAKE_GAMES];
  },

  async getUserGames(userId) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return FAKE_GAMES.filter(game => 
      game.player1Id === userId || game.player2Id === userId
    );
  },

  async getUserById(userId) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (userId === ADMIN_USER.id) {
      return ADMIN_USER;
    }
    
    return FAKE_USERS.find(user => user.id === userId) || null;
  },

  async getSystemStats() {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const totalGames = FAKE_GAMES.length;
    const totalUsers = FAKE_USERS.length;
    const activeUsers = FAKE_USERS.filter(user => 
      FAKE_GAMES.some(game => 
        game.player1Id === user.id || game.player2Id === user.id
      )
    ).length;

    const totalWinRate = FAKE_USERS.reduce((sum, user) => sum + user.stats.winRate, 0) / FAKE_USERS.length;
    const totalScore = FAKE_USERS.reduce((sum, user) => sum + user.stats.totalScore, 0);

    return {
      totalGames,
      totalUsers,
      activeUsers,
      averageWinRate: Math.round(totalWinRate),
      totalScore
    };
  }
};