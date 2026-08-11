import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "nexcusai.firebaseapp.com",
  projectId: "nexcusai",
  storageBucket: "nexcusai.firebasestorage.app",
  messagingSenderId: "1048394703420",
  appId: "1:1048394703420:web:6a09a66a94df051c449939",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };