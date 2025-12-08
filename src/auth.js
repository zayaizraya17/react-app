// auth.js - Убираем импорт самого себя
// УДАЛИТЕ эту строку: import { Auth } from './auth';

// Импортируем UserManager
import { UserManager } from './userManager';

export const Auth = {
  // Получить текущего пользователя из localStorage
  getCurrentUser() {
    try {
      const userJson = localStorage.getItem('tic-tac-toe_user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Вход пользователя
  async login(username, password) {
    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Проверка учетных данных администратора
    if (username === 'Admin' && password === 'Admin') {
      const adminUser = {
        id: 'admin-001',
        username: 'Admin',
        email: 'admin@tic-tac-toe.com',
        firstName: 'Системный',
        lastName: 'Администратор',
        fullName: 'Системный Администратор',
        isAdmin: true,
        avatar: null,
        createdAt: new Date('2024-01-01').toISOString(),
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          gamesLost: 0,
          gamesDrawn: 0,
          totalScore: 0,
          winRate: 0
        }
      };
      
      localStorage.setItem('tic-tac-toe_user', JSON.stringify(adminUser));
      return { success: true, user: adminUser };
    }
    
    // Ищем пользователя в UserManager
    const result = UserManager.authenticate(username, password);
    
    if (result.success) {
      // Сохраняем пользователя в сессии (без пароля)
      localStorage.setItem('tic-tac-toe_user', JSON.stringify(result.user));
      return { success: true, user: result.user };
    }
    
    return {
      success: false,
      message: 'Неверное имя пользователя или пароль'
    };
  },

  // Регистрация нового пользователя
  async register(userData) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Используем UserManager для создания пользователя
    const result = UserManager.createUser(userData);
    
    if (result.success) {
      // Автоматически логиним после успешной регистрации
      const loginResult = UserManager.authenticate(userData.username, userData.password);
      if (loginResult.success) {
        // Сохраняем пользователя в сессии
        localStorage.setItem('tic-tac-toe_user', JSON.stringify(loginResult.user));
        return { success: true, user: loginResult.user };
      } else {
        return { 
          success: false, 
          message: 'Регистрация успешна, но не удалось войти автоматически' 
        };
      }
    }
    
    return result;
  },

  // Выход из системы
  logout() {
    localStorage.removeItem('tic-tac-toe_user');
  },

  // Обновить данные текущего пользователя
  updateCurrentUser(updatedUser) {
    try {
      // Обновляем текущего пользователя в сессии
      localStorage.setItem('tic-tac-toe_user', JSON.stringify(updatedUser));
      
      // Также обновляем в UserManager (если это не админ)
      if (!updatedUser.isAdmin) {
        const existingUser = UserManager.getUserByUsername(updatedUser.username);
        if (existingUser) {
          // Сохраняем пароль из старой записи
          if (existingUser.password) {
            updatedUser.password = existingUser.password;
          }
          
          UserManager.saveUser({ ...existingUser, ...updatedUser });
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  },

  // Получить пользователя по ID (для администратора)
  getUserById(userId) {
    if (userId === 'admin-001') {
      return {
        id: 'admin-001',
        username: 'Admin',
        email: 'admin@tic-tac-toe.com',
        firstName: 'Системный',
        lastName: 'Администратор',
        isAdmin: true,
        avatar: null,
        createdAt: new Date('2024-01-01').toISOString(),
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          gamesLost: 0,
          gamesDrawn: 0,
          totalScore: 0,
          winRate: 0
        }
      };
    }
    
    return UserManager.getUserById(userId);
  },

  // Получить всех пользователей (для администратора)
  getAllUsers() {
    try {
      // Используем UserManager для получения всех пользователей
      const users = UserManager.getAllUsers();
      
      // Возвращаем пользователей без паролей
      return users.map(({ password: _, ...user }) => user);
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  },

  // Проверить, существует ли пользователь с таким именем
  usernameExists(username) {
    try {
      return UserManager.getUserByUsername(username) !== null;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  },

  // Проверить, существует ли пользователь с таким email
  emailExists(email) {
    try {
      const users = UserManager.getAllUsers();
      return users.some(user => user.email === email);
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  },

  // Сменить пароль
  async changePassword(username, currentPassword, newPassword) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      // Получаем пользователя
      const user = UserManager.getUserByUsername(username);
      if (!user) {
        return {
          success: false,
          message: 'Пользователь не найден'
        };
      }
      
      // Проверяем текущий пароль
      if (user.password !== currentPassword) {
        return {
          success: false,
          message: 'Текущий пароль неверен'
        };
      }
      
      // Обновляем пароль
      const updatedUser = {
        ...user,
        password: newPassword,
        passwordChangedAt: new Date().toISOString()
      };
      
      UserManager.saveUser(updatedUser);
      
      // Сохраняем информацию о пароле
      const passwordInfo = {
        username: username,
        changedAt: new Date().toISOString(),
        isExpired: false,
        ageInDays: 0
      };
      localStorage.setItem(`tic-tac-toe_password_${username}`, JSON.stringify(passwordInfo));
      
      return { success: true };
    } catch (error) {
      console.error('Error changing password:', error);
      return {
        success: false,
        message: 'Произошла ошибка при смене пароля'
      };
    }
  },

  // Получить информацию о пароле пользователя
  getPasswordInfo(username) {
    try {
      const passwordInfo = localStorage.getItem(`tic-tac-toe_password_${username}`);
      if (passwordInfo) {
        const data = JSON.parse(passwordInfo);
        const changedDate = new Date(data.changedAt);
        const today = new Date();
        const ageInDays = Math.floor((today - changedDate) / (1000 * 60 * 60 * 24));
        
        return {
          ...data,
          ageInDays,
          isExpired: ageInDays > 90
        };
      }
      
      // Если информации нет, возвращаем дефолтные значения
      return {
        changedAt: null,
        ageInDays: null,
        isExpired: false
      };
    } catch (error) {
      console.error('Error getting password info:', error);
      return {
        changedAt: null,
        ageInDays: null,
        isExpired: false
      };
    }
  },

  // Поиск пользователей (для друзей и т.д.)
  searchUsers(searchTerm, currentUsername) {
    try {
      const users = UserManager.searchUsers(searchTerm, currentUsername);
      
      // Возвращаем пользователей без паролей
      return users.map(({ password: _, ...user }) => user);
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }
};

export default Auth;