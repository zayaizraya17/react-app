import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, deleteDoc, query, where, getDocs, orderBy, limit, serverTimestamp, increment } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, onAuthStateChanged } from 'firebase/auth';
import { firebaseConfig } from './firebase-config';

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Инициализация сервисов
export const db = getFirestore(app);
export const auth = getAuth(app);

// Коллекции Firestore
export const USERS_COLLECTION = 'users';
export const GAMES_COLLECTION = 'games';
export const LEADERBOARD_COLLECTION = 'leaderboard';
export const FRIENDS_COLLECTION = 'friends';
export const REQUESTS_COLLECTION = 'friend_requests';

// ========== ПОЛЬЗОВАТЕЛИ ==========

/**
 * Регистрация нового пользователя в Firebase Auth и Firestore
 */
export const registerUser = async (userData) => {
  try {
    // 1. Создаем пользователя в Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );

    const user = userCredential.user;

    // 2. Обновляем профиль в Auth
    await updateProfile(user, {
      displayName: userData.username
    });

    // 3. Создаем документ пользователя в Firestore
    const userDoc = {
      uid: user.uid,
      username: userData.username,
      email: userData.email,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
      avatar: userData.avatar || null,
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

    await setDoc(doc(db, USERS_COLLECTION, user.uid), userDoc);

    // 4. Создаем запись в лидерборде
    await setDoc(doc(db, LEADERBOARD_COLLECTION, user.uid), {
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

    return {
      success: true,
      user: {
        id: user.uid,
        ...userDoc,
        stats: userDoc.stats
      }
    };
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    return {
      success: false,
      message: error.message || 'Ошибка при регистрации'
    };
  }
};

/**
 * Вход пользователя
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Обновляем время последнего входа
    await updateDoc(doc(db, USERS_COLLECTION, user.uid), {
      lastLogin: serverTimestamp()
    });

    // Получаем данные пользователя из Firestore
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, user.uid));
    
    if (!userDoc.exists()) {
      throw new Error('Данные пользователя не найдены');
    }

    const userData = userDoc.data();

    return {
      success: true,
      user: {
        id: user.uid,
        ...userData
      }
    };
  } catch (error) {
    console.error('Ошибка входа:', error);
    return {
      success: false,
      message: error.message || 'Ошибка при входе'
    };
  }
};

/**
 * Выход пользователя
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Ошибка выхода:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Получить текущего пользователя
 */
export const getCurrentUser = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, USERS_COLLECTION, user.uid));
          if (userDoc.exists()) {
            resolve({
              id: user.uid,
              ...userDoc.data()
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
 * Обновить профиль пользователя
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      ...updates,
      updatedAt: serverTimestamp()
    });

    // Если обновляем имя, обновляем и лидерборд
    if (updates.fullName || updates.username) {
      await updateDoc(doc(db, LEADERBOARD_COLLECTION, userId), {
        username: updates.username,
        fullName: updates.fullName,
        updatedAt: serverTimestamp()
      });
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
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
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
export const saveGameResult = async (gameData) => {
  try {
    const { userId, username, win, score, aiLevel, squares, opponent } = gameData;
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 1. Сохраняем игру в коллекцию игр
    const gameDoc = {
      id: gameId,
      playerId: userId,
      playerUsername: username,
      opponent: opponent || 'ИИ',
      win: win, // true, false, или null для ничьей
      score: score || 0,
      aiLevel: aiLevel || 'medium',
      squares: squares || [],
      timestamp: serverTimestamp(),
      isNetworkGame: aiLevel === 'network'
    };

    await setDoc(doc(db, GAMES_COLLECTION, gameId), gameDoc);

    // 2. Обновляем статистику пользователя
    const userRef = doc(db, USERS_COLLECTION, userId);
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

      // 3. Обновляем лидерборд
      const leaderboardRef = doc(db, LEADERBOARD_COLLECTION, userId);
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
      } else {
        // Создаем запись в лидерборде, если ее нет
        await setDoc(leaderboardRef, {
          uid: userId,
          username: username,
          fullName: userData.fullName || username,
          score: score || 0,
          gamesPlayed: 1,
          wins: win === true ? 1 : 0,
          losses: win === false ? 1 : 0,
          draws: win === null ? 1 : 0,
          winRate: newStats.winRate,
          lastPlayed: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }

    return { success: true, gameId };
  } catch (error) {
    console.error('Ошибка сохранения игры:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Получить игры пользователя
 */
export const getUserGames = async (userId, limitCount = 50) => {
  try {
    const gamesQuery = query(
      collection(db, GAMES_COLLECTION),
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

// ========== ЛИДЕРБОРД ==========

/**
 * Получить лидерборд
 */
export const getLeaderboard = async (limitCount = 20) => {
  try {
    const leaderboardQuery = query(
      collection(db, LEADERBOARD_COLLECTION),
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
    console.error('Ошибка получения лидерборда:', error);
    return { success: false, leaderboard: [], message: error.message };
  }
};

/**
 * Получить статистику системы
 */
export const getSystemStats = async () => {
  try {
    // Получаем топ игроков для расчета средней статистики
    const leaderboardQuery = query(
      collection(db, LEADERBOARD_COLLECTION),
      orderBy('score', 'desc'),
      limit(100)
    );

    const snapshot = await getDocs(leaderboardQuery);
    const players = snapshot.docs.map(doc => doc.data());

    let totalGames = 0;
    let totalWins = 0;
    let totalScore = 0;

    players.forEach(player => {
      totalGames += player.gamesPlayed || 0;
      totalWins += player.wins || 0;
      totalScore += player.score || 0;
    });

    const averageWinRate = players.length > 0 
      ? Math.round(players.reduce((sum, player) => sum + (player.winRate || 0), 0) / players.length)
      : 0;

    // Получаем общее количество пользователей
    const usersQuery = query(collection(db, USERS_COLLECTION));
    const usersSnapshot = await getDocs(usersQuery);
    const totalUsers = usersSnapshot.docs.filter(doc => !doc.data().isAdmin).length;

    // Активные пользователи (играли в последние 7 дней)
    const activeUsers = players.filter(player => {
      if (!player.lastPlayed) return false;
      const lastPlayedDate = player.lastPlayed.toDate();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return lastPlayedDate > sevenDaysAgo;
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
    console.error('Ошибка получения статистики:', error);
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

// ========== ДРУЗЬЯ ==========

/**
 * Отправить запрос в друзья
 */
export const sendFriendRequest = async (fromUserId, toUserId, fromUsername) => {
  try {
    const requestId = `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const requestDoc = {
      id: requestId,
      from: fromUserId,
      fromUsername: fromUsername,
      to: toUserId,
      status: 'pending',
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, REQUESTS_COLLECTION, requestId), requestDoc);
    return { success: true, requestId };
  } catch (error) {
    console.error('Ошибка отправки запроса:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Получить запросы в друзья
 */
export const getFriendRequests = async (userId, type = 'incoming') => {
  try {
    let requestsQuery;
    
    if (type === 'incoming') {
      // Входящие запросы
      requestsQuery = query(
        collection(db, REQUESTS_COLLECTION),
        where('to', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
    } else {
      // Исходящие запросы
      requestsQuery = query(
        collection(db, REQUESTS_COLLECTION),
        where('from', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
    }

    const snapshot = await getDocs(requestsQuery);
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, requests };
  } catch (error) {
    console.error('Ошибка получения запросов:', error);
    return { success: false, requests: [], message: error.message };
  }
};

/**
 * Принять запрос в друзья
 */
export const acceptFriendRequest = async (requestId, fromUserId, toUserId) => {
  try {
    const requestRef = doc(db, REQUESTS_COLLECTION, requestId);
    
    // Обновляем статус запроса
    await updateDoc(requestRef, {
      status: 'accepted',
      acceptedAt: serverTimestamp()
    });

    // Добавляем друзей друг другу
    const friendId1 = `friend_${fromUserId}_${toUserId}`;
    const friendId2 = `friend_${toUserId}_${fromUserId}`;

    await setDoc(doc(db, FRIENDS_COLLECTION, friendId1), {
      user1: fromUserId,
      user2: toUserId,
      since: serverTimestamp()
    });

    await setDoc(doc(db, FRIENDS_COLLECTION, friendId2), {
      user1: toUserId,
      user2: fromUserId,
      since: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Ошибка принятия запроса:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Отклонить запрос в друзья
 */
export const rejectFriendRequest = async (requestId) => {
  try {
    await updateDoc(doc(db, REQUESTS_COLLECTION, requestId), {
      status: 'rejected',
      rejectedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Ошибка отклонения запроса:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Получить список друзей
 */
export const getFriends = async (userId) => {
  try {
    const friendsQuery = query(
      collection(db, FRIENDS_COLLECTION),
      where('user1', '==', userId)
    );

    const snapshot = await getDocs(friendsQuery);
    const friendIds = snapshot.docs.map(doc => doc.data().user2);

    // Получаем данные друзей
    const friendsData = [];
    for (const friendId of friendIds) {
      const friendDoc = await getDoc(doc(db, USERS_COLLECTION, friendId));
      if (friendDoc.exists()) {
        const friendData = friendDoc.data();
        friendsData.push({
          id: friendId,
          username: friendData.username,
          fullName: friendData.fullName,
          avatar: friendData.avatar,
          stats: friendData.stats || {}
        });
      }
    }

    return { success: true, friends: friendsData };
  } catch (error) {
    console.error('Ошибка получения друзей:', error);
    return { success: false, friends: [], message: error.message };
  }
};

/**
 * Удалить друга
 */
export const removeFriend = async (userId, friendId) => {
  try {
    const friendId1 = `friend_${userId}_${friendId}`;
    const friendId2 = `friend_${friendId}_${userId}`;

    // Удаляем обе записи о дружбе
    await deleteDoc(doc(db, FRIENDS_COLLECTION, friendId1));
    await deleteDoc(doc(db, FRIENDS_COLLECTION, friendId2));

    return { success: true };
  } catch (error) {
    console.error('Ошибка удаления друга:', error);
    return { success: false, message: error.message };
  }
};

// ========== АДМИНИСТРАТОР ==========

/**
 * Получить всех пользователей (для администратора)
 */
export const getAllUsers = async () => {
  try {
    const usersQuery = query(collection(db, USERS_COLLECTION));
    const snapshot = await getDocs(usersQuery);
    
    const users = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(user => !user.isAdmin); // Исключаем админов

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
      collection(db, GAMES_COLLECTION),
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

export default {
  // Auth
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
  updateUserAvatar,
  
  // Games
  saveGameResult,
  getUserGames,
  
  // Leaderboard
  getLeaderboard,
  getSystemStats,
  
  // Friends
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  removeFriend,
  
  // Admin
  getAllUsers,
  getAllGames,
  
  // Экспорты для прямого доступа
  db,
  auth
};