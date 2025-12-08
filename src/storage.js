// storage.js - ИСПРАВЛЕННАЯ ВЕРСИЯ для работы с массивом пользователей
export const Storage = {
  // Ключи для localStorage
  KEYS: {
    USERS: 'tic-tac-toe_users', // Храним как массив
    CURRENT_USER: 'tic-tac-toe_current_user',
    USER_STATS: (username) => `tic-tac-toe_stats_${username}`,
    USER_GAMES: (username) => `tic-tac-toe_games_${username}`,
    USER_AVATAR: (username) => `tic-tac-toe_avatar_${username}`,
    USER_FRIENDS: (username) => `tic-tac-toe_friends_${username}`,
    USER_FRIEND_REQUESTS: (username) => `tic-tac-toe_friend_requests_${username}`
  },
  
  // Работа с пользователями (работаем с массивом)
  saveUser: (user) => {
    const users = Storage.getAllUsers();
    const userIndex = users.findIndex(u => u.username === user.username);
    
    if (userIndex !== -1) {
      // Обновляем существующего пользователя
      users[userIndex] = { ...users[userIndex], ...user };
    } else {
      // Добавляем нового пользователя
      users.push(user);
    }
    
    localStorage.setItem(Storage.KEYS.USERS, JSON.stringify(users));
  },

  getUser: (username) => {
    const users = Storage.getAllUsers();
    return users.find(u => u.username === username) || null;
  },

  getAllUsers: () => {
    const usersJson = localStorage.getItem(Storage.KEYS.USERS);
    
    try {
      if (!usersJson) return [];
      
      const parsed = JSON.parse(usersJson);
      
      // Проверяем формат данных
      if (Array.isArray(parsed)) {
        // Это массив - всё хорошо
        return parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        // Это объект - преобразуем в массив
        console.warn('Преобразуем объект пользователей в массив...');
        const usersArray = Object.values(parsed);
        localStorage.setItem(Storage.KEYS.USERS, JSON.stringify(usersArray));
        return usersArray;
      } else {
        // Неизвестный формат - создаем пустой массив
        console.warn('Некорректный формат пользователей, создаем массив...');
        localStorage.setItem(Storage.KEYS.USERS, JSON.stringify([]));
        return [];
      }
    } catch (error) {
      console.error('Ошибка парсинга пользователей:', error);
      localStorage.setItem(Storage.KEYS.USERS, JSON.stringify([]));
      return [];
    }
  },

  // Текущий пользователь
  setCurrentUser: (user) => {
    localStorage.setItem(Storage.KEYS.CURRENT_USER, JSON.stringify(user));
  },

  getCurrentUser: () => {
    const userJson = localStorage.getItem(Storage.KEYS.CURRENT_USER);
    return userJson ? JSON.parse(userJson) : null;
  },

  clearCurrentUser: () => {
    localStorage.removeItem(Storage.KEYS.CURRENT_USER);
  },

  // Статистика пользователя
  getUserStats: (username) => {
    const defaultStats = {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      score: 0,
      lastPlayed: null
    };

    const statsJson = localStorage.getItem(Storage.KEYS.USER_STATS(username));
    return statsJson ? JSON.parse(statsJson) : defaultStats;
  },

  updateUserStats: (username, gameResult) => {
    const stats = Storage.getUserStats(username);
    
    stats.gamesPlayed += 1;
    stats.lastPlayed = new Date().toISOString();
    
    if (gameResult.win === true) {
      stats.wins += 1;
      stats.score += gameResult.score;
    } else if (gameResult.win === false) {
      stats.losses += 1;
      stats.score += gameResult.score;
    } else {
      stats.draws += 1;
    }
    
    localStorage.setItem(Storage.KEYS.USER_STATS(username), JSON.stringify(stats));
    
    // Также обновляем основную запись пользователя
    const user = Storage.getUser(username);
    if (user) {
      user.score = stats.score;
      user.gamesPlayed = stats.gamesPlayed;
      user.wins = stats.wins;
      user.losses = stats.losses;
      user.draws = stats.draws;
      Storage.saveUser(user);
    }
    
    return stats;
  },

  // Игры пользователя
  getUserGames: (username) => {
    const gamesJson = localStorage.getItem(Storage.KEYS.USER_GAMES(username));
    return gamesJson ? JSON.parse(gamesJson) : [];
  },

  saveGameResult: (username, gameData) => {
    const games = Storage.getUserGames(username);
    
    const gameRecord = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      win: gameData.win,
      score: gameData.score || 0,
      aiLevel: gameData.aiLevel,
      squares: gameData.squares
    };
    
    games.push(gameRecord);
    localStorage.setItem(Storage.KEYS.USER_GAMES(username), JSON.stringify(games));
    
    // Обновляем статистику
    Storage.updateUserStats(username, gameRecord);
  },

  // Аватар пользователя
  getUserAvatar: (username) => {
    const avatarData = localStorage.getItem(Storage.KEYS.USER_AVATAR(username));
    return avatarData || null;
  },

  saveUserAvatar: (username, avatarData) => {
    localStorage.setItem(Storage.KEYS.USER_AVATAR(username), avatarData);
    
    // Также обновляем запись пользователя
    const user = Storage.getUser(username);
    if (user) {
      user.hasAvatar = true;
      user.avatarUpdatedAt = new Date().toISOString();
      Storage.saveUser(user);
    }
  },

  deleteUserAvatar: (username) => {
    localStorage.removeItem(Storage.KEYS.USER_AVATAR(username));
    
    // Обновляем запись пользователя
    const user = Storage.getUser(username);
    if (user) {
      user.hasAvatar = false;
      Storage.saveUser(user);
    }
  },

  // Лидерборд - ИСПРАВЛЕНО для работы с массивом
  getLeaderboard: (limit = 20) => {
    const users = Storage.getAllUsers();
    
    // Получаем статистику для каждого пользователя
    const leaderboard = users
      .map(user => {
        const stats = Storage.getUserStats(user.username);
        
        return {
          ...user,
          score: stats.score || user.score || 0,
          gamesPlayed: stats.gamesPlayed || user.gamesPlayed || 0,
          wins: stats.wins || user.wins || 0,
          losses: stats.losses || user.losses || 0,
          draws: stats.draws || user.draws || 0,
          lastPlayed: stats.lastPlayed || user.lastPlayed || null
        };
      })
      .filter(user => (user.gamesPlayed || 0) > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);
      
    return leaderboard;
  },
  
  getUserFriends: (username) => {
    const friendsJson = localStorage.getItem(Storage.KEYS.USER_FRIENDS(username));
    return friendsJson ? JSON.parse(friendsJson) : [];
  },

  saveUserFriends: (username, friendsList) => {
    localStorage.setItem(Storage.KEYS.USER_FRIENDS(username), JSON.stringify(friendsList));
  },

  addFriend: (username, friendUsername) => {
    const friends = Storage.getUserFriends(username);
    if (!friends.includes(friendUsername)) {
      friends.push(friendUsername);
      Storage.saveUserFriends(username, friends);
    }
  },

  removeFriend: (username, friendUsername) => {
    const friends = Storage.getUserFriends(username);
    const updatedFriends = friends.filter(friend => friend !== friendUsername);
    Storage.saveUserFriends(username, updatedFriends);
  },

  // Запросы в друзья
  getFriendRequests: (username) => {
    const requestsJson = localStorage.getItem(Storage.KEYS.USER_FRIEND_REQUESTS(username));
    return requestsJson ? JSON.parse(requestsJson) : [];
  },

  saveFriendRequests: (username, requests) => {
    localStorage.setItem(Storage.KEYS.USER_FRIEND_REQUESTS(username), JSON.stringify(requests));
  },

  sendFriendRequest: (fromUsername, toUsername) => {
    const requests = Storage.getFriendRequests(toUsername);
    
    const existingRequest = requests.find(req => 
      req.from === fromUsername && req.to === toUsername && req.status === 'pending'
    );
    
    if (!existingRequest) {
      const newRequest = {
        id: Date.now(),
        from: fromUsername,
        to: toUsername,
        status: 'pending',
        timestamp: new Date().toISOString()
      };
      
      requests.push(newRequest);
      Storage.saveFriendRequests(toUsername, requests);
      return newRequest;
    }
    
    return null;
  },

  acceptFriendRequest: (username, requestId) => {
    const requests = Storage.getFriendRequests(username);
    const requestIndex = requests.findIndex(req => req.id === requestId && req.status === 'pending');
    
    if (requestIndex !== -1) {
      const request = requests[requestIndex];
      request.status = 'accepted';
      request.respondedAt = new Date().toISOString();
      
      Storage.addFriend(username, request.from);
      Storage.addFriend(request.from, username);
      
      Storage.saveFriendRequests(username, requests);
      return request;
    }
    
    return null;
  },

  rejectFriendRequest: (username, requestId) => {
    const requests = Storage.getFriendRequests(username);
    const requestIndex = requests.findIndex(req => req.id === requestId && req.status === 'pending');
    
    if (requestIndex !== -1) {
      const request = requests[requestIndex];
      request.status = 'rejected';
      request.respondedAt = new Date().toISOString();
      
      Storage.saveFriendRequests(username, requests);
      return request;
    }
    
    return null;
  },

  // Проверка статуса дружбы
  getFriendshipStatus: (username, otherUsername) => {
    const friends = Storage.getUserFriends(username);
    const isFriend = friends.includes(otherUsername);
    
    if (isFriend) {
      return { status: 'friends' };
    }
    
    const outgoingRequests = Storage.getFriendRequests(otherUsername);
    const sentRequest = outgoingRequests.find(req => 
      req.from === username && req.to === otherUsername && req.status === 'pending'
    );
    
    if (sentRequest) {
      return { status: 'request_sent', requestId: sentRequest.id };
    }
    
    const incomingRequests = Storage.getFriendRequests(username);
    const receivedRequest = incomingRequests.find(req => 
      req.from === otherUsername && req.to === username && req.status === 'pending'
    );
    
    if (receivedRequest) {
      return { status: 'request_received', requestId: receivedRequest.id };
    }
    
    return { status: 'not_friends' };
  },

  // Поиск пользователей - ИСПРАВЛЕНО для работы с массивом
  searchUsers: (searchTerm, currentUsername, limit = 20) => {
    const users = Storage.getAllUsers();
    const searchLower = searchTerm.toLowerCase();
    
    return users
      .filter(user => 
        user.username !== currentUsername &&
        (user.username.toLowerCase().includes(searchLower) || 
         (user.fullName && user.fullName.toLowerCase().includes(searchLower)))
      )
      .slice(0, limit)
      .map(user => ({
        ...user,
        friendshipStatus: Storage.getFriendshipStatus(currentUsername, user.username)
      }));
  },

  // Получение друзей с полной информацией - ИСПРАВЛЕНО
  getFriendsWithInfo: (username) => {
    const friendsUsernames = Storage.getUserFriends(username);
    const users = Storage.getAllUsers();
    
    return friendsUsernames
      .map(friendUsername => {
        const user = users.find(u => u.username === friendUsername);
        if (!user) return null;
        
        const stats = Storage.getUserStats(friendUsername);
        const avatar = Storage.getUserAvatar(friendUsername);
        
        return {
          ...user,
          ...stats,
          avatar,
          isOnline: false,
          lastSeen: stats.lastPlayed
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  },

  // Очистка всех данных
  clearAll: () => {
    localStorage.clear();
  }
};