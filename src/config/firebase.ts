import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// A1print Studio Firebase Real-Time Cloud Database Configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1PrintStudioStorefront2026Key",
  authDomain: "a1print-studio.firebaseapp.com",
  projectId: "a1print-studio-app",
  storageBucket: "a1print-studio-app.appspot.com",
  messagingSenderId: "9583626786",
  appId: "1:9583626786:web:a1printstudio2026"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
