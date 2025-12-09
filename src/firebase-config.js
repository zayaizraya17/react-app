import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
export const firebaseConfig = {
  apiKey: "AIzaSyD_Xocs0voQhgveekECWGq-hZ6TfedfIpg",
  authDomain: "task1-6ac0b.firebaseapp.com",
  projectId: "task1-6ac0b",
  storageBucket: "task1-6ac0b.firebasestorage.app",
  messagingSenderId: "157651581979",
  appId: "1:157651581979:web:9d47ccd2f850bf84bf4cbe",
  measurementId: "G-654GKQ3KJB"
};
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);