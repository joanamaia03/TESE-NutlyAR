import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBvu4BzVx5ZHWLLc27GILtDZz8UVfzcdws",
  authDomain: "nutlyar.firebaseapp.com",
  projectId: "nutlyar",
  storageBucket: "nutlyar.firebasestorage.app",
  messagingSenderId: "226950885894",
  appId: "1:226950885894:web:64e56ccd03389f46c10987"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firestore Database
export const db = getFirestore(app);

export default app;
