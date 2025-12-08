// userManager.js - создайте этот файл
export const UserManager = {
  // Получить всех пользователей
  getAllUsers() {
    try {
      const usersJson = localStorage.getItem('tic-tac-toe_users');
      if (!usersJson) return [];
      
      const parsed = JSON.parse(usersJson);
      
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        // Преобразуем объект в массив
        const usersArray = Object.values(parsed);
        localStorage.setItem('tic-tac-toe_users', JSON.stringify(usersArray));
        return usersArray;
      }
      
      return [];
    } catch (error) {
      console.error('Error getting users:', error);
      localStorage.setItem('tic-tac-toe_users', JSON.stringify([]));
      return [];
    }
  },

  getUserByUsername(username) {
    const users = this.getAllUsers();
    return users.find(user => user.username === username) || null;
  },

  getUserById(id) {
    const users = this.getAllUsers();
    return users.find(user => user.id === id) || null;
  },

  saveUser(user) {
    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.username === user.username);
    
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...user };
    } else {
      users.push(user);
    }
    
    localStorage.setItem('tic-tac-toe_users', JSON.stringify(users));
    return user;
  },

  createUser(userData) {
    // Проверяем существующего пользователя
    const existingUser = this.getUserByUsername(userData.username);
    if (existingUser) {
      return { success: false, message: 'Пользователь уже существует' };
    }

    // Создаем нового пользователя
    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username: userData.username,
      password: userData.password,
      email: userData.email,
      firstName: userData.firstName || userData.username,
      lastName: userData.lastName || '',
      fullName: userData.fullName || userData.username,
      phone: userData.phone || '',
      isAdmin: false,
      createdAt: new Date().toISOString(),
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        gamesDrawn: 0,
        totalScore: 0,
        winRate: 0
      },
      hasAvatar: false,
      avatar: null,
      score: 0,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0
    };

    const savedUser = this.saveUser(newUser);
    const { password: _, ...userWithoutPassword } = savedUser;
    
    return {
      success: true,
      user: userWithoutPassword
    };
  },

  authenticate(username, password) {
    const users = this.getAllUsers();
    const user = users.find(u => 
      (u.username === username || u.email === username) && 
      u.password === password
    );
    
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword };
    }
    
    return { success: false, message: 'Неверные учетные данные' };
  },

  searchUsers(searchTerm, excludeUsername = '', limit = 20) {
    const users = this.getAllUsers();
    const searchLower = searchTerm.toLowerCase();
    
    return users
      .filter(user => 
        user.username !== excludeUsername &&
        (user.username.toLowerCase().includes(searchLower) || 
         (user.fullName && user.fullName.toLowerCase().includes(searchLower)))
      )
      .slice(0, limit);
  }
};