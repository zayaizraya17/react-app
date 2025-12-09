
// Совместимость со старым кодом
// Реэкспортируем функции из firebase.js
import { 
  getCurrentUser,
  registerUser,
  loginUser,
  logoutUser,
  updateUserProfile,
  updateUserAvatar,
  saveGameResult,
  getLeaderboard,
  getSystemStats,
  getAllUsers,
  getAllGames,
  getUserGames,
  getUserById,
  testFirebaseConnection,
  db,
  auth
} from './firebase';

// Экспортируем все функции под старыми именами
export const Auth = {
  // Auth
  getCurrentUser,
  register: registerUser,
  login: loginUser,
  logout: logoutUser,
  updateUserProfile,
  updateUserAvatar,
  
  // Games
  saveGameResult,
  
  // Leaderboard
  getLeaderboard,
  getSystemStats,
  
  // Admin
  getAllUsers,
  getAllGames,
  
  // Utils
  testFirebaseConnection,
  
  // Services
  db,
  auth
};

// Экспорты по отдельности для совместимости
export {
  getCurrentUser,
  registerUser as register,
  loginUser as login,
  logoutUser as logout,
  updateUserProfile,
  updateUserAvatar,
  saveGameResult,
  getLeaderboard,
  getSystemStats,
  getAllUsers,
  getAllGames,
  getUserGames,
  getUserById,
  testFirebaseConnection,
  db,
  auth
};

export default Auth;
