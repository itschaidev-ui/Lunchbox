
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCgywZbVA9aYUxqNiOKVxXVk3KLTJJSSho",
  authDomain: "studio-7195653935-eecd8.firebaseapp.com",
  databaseURL: "https://studio-7195653935-eecd8-default-rtdb.firebaseio.com",
  projectId: "studio-7195653935-eecd8",
  storageBucket: "studio-7195653935-eecd8.firebasestorage.app",
  messagingSenderId: "618021672555",
  appId: "1:618021672555:web:c3f3c2360d0cb63cf2432e"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
