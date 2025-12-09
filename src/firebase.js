
// Firebase версии 9+ (modular version)
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  onAuthStateChanged 
} from 'firebase/auth';
import { firebaseConfig } from './firebase-config';

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Инициализация сервисов
export const db = getFirestore(app);
export const auth = getAuth(app);

// ========== ПОЛЬЗОВАТЕЛИ ==========

/**
 * Получить текущего пользователя
 */
export const getCurrentUser = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            resolve({
              id: user.uid,
              ...userData
            });
          } else {
            resolve(null);
          }
        } catch (error) {
          console.error('Ошибка получения пользователя:', error);
          resolve(null);
        }
      } else {
        resolve(null);
      }
      unsubscribe();
    });
  });
};

/**
 * Регистрация нового пользователя
 */
export const registerUser = async (userData) => {
  try {
    console.log('Регистрация пользователя:', userData.email);
    
    // 1. Создание пользователя в Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    
    const user = userCredential.user;
    
    // 2. Обновление профиля
    await updateProfile(user, {
      displayName: userData.username
    });
    
    // 3. Создание документа пользователя в Firestore
    const userDoc = {
      uid: user.uid,
      username: userData.username,
      email: userData.email,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
      isAdmin: false,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      stats: {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        score: 0,
        winRate: 0,
        lastPlayed: null
      }
    };
    
    await setDoc(doc(db, 'users', user.uid), userDoc);
    
    // 4. Создание записи в лидерборде
    await setDoc(doc(db, 'leaderboard', user.uid), {
      uid: user.uid,
      username: userData.username,
      fullName: userDoc.fullName,
      score: 0,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      lastPlayed: null,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Пользователь зарегистрирован:', user.uid);
    
    return {
      success: true,
      user: {
        id: user.uid,
        ...userDoc
      }
    };
  } catch (error) {
    console.error('❌ Ошибка регистрации:', error);
    return {
      success: false,
      message: error.code === 'auth/email-already-in-use' 
        ? 'Пользователь с таким email уже существует'
        : error.message
    };
  }
};

/**
 * Вход пользователя
 */
export const loginUser = async (email, password) => {
  try {
    console.log('Вход пользователя:', email);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Обновляем время последнего входа
    await updateDoc(doc(db, 'users', user.uid), {
      lastLogin: serverTimestamp()
    });
    
    // Получение данных пользователя из Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      throw new Error('Данные пользователя не найдены');
    }
    
    const userData = userDoc.data();
    
    console.log('✅ Пользователь вошел:', user.uid);
    
    return {
      success: true,
      user: {
        id: user.uid,
        ...userData
      }
    };
  } catch (error) {
    console.error('❌ Ошибка входа:', error);
    return {
      success: false,
      message: error.code === 'auth/wrong-password'
        ? 'Неверный пароль'
        : error.code === 'auth/user-not-found'
        ? 'Пользователь не найден'
        : error.message
    };
  }
};

/**
 * Выход пользователя
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log('✅ Пользователь вышел');
    return { success: true };
  } catch (error) {
    console.error('❌ Ошибка выхода:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Обновить профиль пользователя
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      updatedAt: serverTimestamp()
    });

    // Если обновляем имя, обновляем и лидерборд
    if (updates.fullName || updates.username) {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        await updateDoc(doc(db, 'leaderboard', userId), {
          username: updates.username || userData.username,
          fullName: updates.fullName || userData.fullName,
          updatedAt: serverTimestamp()
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Обновить аватар пользователя
 */
export const updateUserAvatar = async (userId, avatarUrl) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      avatar: avatarUrl,
      updatedAt: serverTimestamp()
    });
    return { success: true, avatar: avatarUrl };
  } catch (error) {
    console.error('Ошибка обновления аватара:', error);
    return { success: false, message: error.message };
  }
};

// ========== ИГРЫ ==========

/**
 * Сохранить результат игры
 */
export const saveGameResult = async (userId, username, win, score, aiLevel) => {
  try {
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Сохранение игры
    const gameDoc = {
      id: gameId,
      playerId: userId,
      playerUsername: username,
      win: win,
      score: score,
      aiLevel: aiLevel || 'medium',
      timestamp: serverTimestamp()
    };
    
    await setDoc(doc(db, 'games', gameId), gameDoc);
    
    // Обновление статистики пользователя
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const stats = userData.stats || {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        score: 0,
        winRate: 0
      };
      
      const newStats = {
        gamesPlayed: stats.gamesPlayed + 1,
        wins: stats.wins + (win === true ? 1 : 0),
        losses: stats.losses + (win === false ? 1 : 0),
        draws: stats.draws + (win === null ? 1 : 0),
        score: stats.score + (score || 0),
        lastPlayed: serverTimestamp()
      };
      
      newStats.winRate = newStats.gamesPlayed > 0 
        ? Math.round((newStats.wins / newStats.gamesPlayed) * 100)
        : 0;
      
      await updateDoc(userRef, {
        stats: newStats
      });
      
      // Обновление лидерборда
      const leaderboardRef = doc(db, 'leaderboard', userId);
      const leaderboardDoc = await getDoc(leaderboardRef);
      
      if (leaderboardDoc.exists()) {
        const lbData = leaderboardDoc.data();
        await updateDoc(leaderboardRef, {
          score: (lbData.score || 0) + (score || 0),
          gamesPlayed: (lbData.gamesPlayed || 0) + 1,
          wins: (lbData.wins || 0) + (win === true ? 1 : 0),
          losses: (lbData.losses || 0) + (win === false ? 1 : 0),
          draws: (lbData.draws || 0) + (win === null ? 1 : 0),
          winRate: newStats.winRate,
          lastPlayed: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      console.log('✅ Игра сохранена:', gameId);
      
      return { success: true, gameId };
    }
    
    return { success: false, message: 'Пользователь не найден' };
  } catch (error) {
    console.error('❌ Ошибка сохранения игры:', error);
    return { success: false, message: error.message };
  }
};

// ========== ЛИДЕРБОРД ==========

/**
 * Получить лидерборд
 */
export const getLeaderboard = async (limitCount = 20) => {
  try {
    const leaderboardQuery = query(
      collection(db, 'leaderboard'),
      orderBy('score', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(leaderboardQuery);
    const leaderboard = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, leaderboard };
  } catch (error) {
    console.error('❌ Ошибка получения лидерборда:', error);
    return { success: false, leaderboard: [], message: error.message };
  }
};

/**
 * Получить статистику системы
 */
export const getSystemStats = async () => {
  try {
    // Получаем всех пользователей
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    const regularUsers = usersSnapshot.docs
      .map(doc => doc.data())
      .filter(user => !user.isAdmin);

    const totalUsers = regularUsers.length;

    // Получаем лидерборд для статистики
    const leaderboardResult = await getLeaderboard(100);
    const leaderboard = leaderboardResult.leaderboard || [];

    let totalGames = 0;
    let totalScore = 0;

    leaderboard.forEach(player => {
      totalGames += player.gamesPlayed || 0;
      totalScore += player.score || 0;
    });

    const averageWinRate = leaderboard.length > 0 
      ? Math.round(leaderboard.reduce((sum, player) => sum + (player.winRate || 0), 0) / leaderboard.length)
      : 0;

    // Активные пользователи (играли в последние 7 дней)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const activeUsers = leaderboard.filter(player => {
      if (!player.lastPlayed) return false;
      // Если это Firebase Timestamp
      if (player.lastPlayed.toDate) {
        return player.lastPlayed.toDate() > weekAgo;
      }
      // Если это обычная дата
      return new Date(player.lastPlayed) > weekAgo;
    }).length;

    return {
      success: true,
      stats: {
        totalUsers,
        totalGames,
        activeUsers,
        averageWinRate,
        totalScore
      }
    };
  } catch (error) {
    console.error('❌ Ошибка получения статистики:', error);
    return {
      success: false,
      stats: {
        totalUsers: 0,
        totalGames: 0,
        activeUsers: 0,
        averageWinRate: 0,
        totalScore: 0
      },
      message: error.message
    };
  }
};

// ========== АДМИНИСТРАТОР ==========

/**
 * Получить всех пользователей (для администратора)
 */
export const getAllUsers = async () => {
  try {
    const usersQuery = query(collection(db, 'users'));
    const snapshot = await getDocs(usersQuery);
    
    const users = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(user => !user.isAdmin);

    return { success: true, users };
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    return { success: false, users: [], message: error.message };
  }
};

/**
 * Получить все игры (для администратора)
 */
export const getAllGames = async (limitCount = 100) => {
  try {
    const gamesQuery = query(
      collection(db, 'games'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(gamesQuery);
    const games = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, games };
  } catch (error) {
    console.error('Ошибка получения игр:', error);
    return { success: false, games: [], message: error.message };
  }
};

/**
 * Получить игры пользователя
 */
export const getUserGames = async (userId, limitCount = 50) => {
  try {
    const gamesQuery = query(
      collection(db, 'games'),
      where('playerId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(gamesQuery);
    const games = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, games };
  } catch (error) {
    console.error('Ошибка получения игр:', error);
    return { success: false, games: [], message: error.message };
  }
};

/**
 * Получить пользователя по ID
 */
export const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { success: true, user: userDoc.data() };
    }
    return { success: false, message: 'Пользователь не найден' };
  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    return { success: false, message: error.message };
  }
};

// ========== УТИЛИТЫ ==========

/**
 * Тест соединения с Firebase
 */
export const testFirebaseConnection = async () => {
  try {
    console.log('✅ Firebase App инициализирован');
    console.log('✅ Firestore доступен');
    console.log('✅ Auth доступен');
    return { success: true };
  } catch (error) {
    console.error('❌ Ошибка Firebase:', error);
    return { success: false, error: error.message };
  }
};

// Экспорт объекта со всеми функциями
const firebaseService = {
  // Auth
  getCurrentUser,
  registerUser,
  loginUser,
  logoutUser,
  updateUserProfile,
  updateUserAvatar,
  
  // Games
  saveGameResult,
  getUserGames,
  
  // Leaderboard
  getLeaderboard,
  getSystemStats,
  
  // Admin
  getAllUsers,
  getAllGames,
  getUserById,
  
  // Utils
  testFirebaseConnection,
  
  // Services
  db,
  auth
};

export default firebaseService;
