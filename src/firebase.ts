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

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);

// Inicializar a autenticação do Firebase e obter uma referência ao serviço
export const auth = getAuth(app);

// Inicializar o Firestore Database
export const db = getFirestore(app);

export default app;
