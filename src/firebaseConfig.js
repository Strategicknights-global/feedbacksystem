// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
// *** THE FIX IS ON THIS LINE ***
// Make sure getAuth is imported from 'firebase/auth'
import { getAuth } from "firebase/auth"; 
import { getFirestore } from "firebase/firestore";

// Firebase config from environment variables
const firebaseConfig = {

  apiKey: "AIzaSyC_LlG7A66VusG9Lt01kvTnjCTOTUrl1eg",
  authDomain: "feedback-14f0d.firebaseapp.com",
  projectId: "feedback-14f0d",
  storageBucket: "feedback-14f0d.firebasestorage.app",
  messagingSenderId: "580893389642",
  appId: "1:580893389642:web:bdb7c73e8e1cde932e87b3",
  measurementId: "G-LJ8SMN1J12"

  
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
