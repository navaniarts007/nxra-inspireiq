// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration for NxraInspireIQ
const firebaseConfig = {
  apiKey: "AIzaSyBCQoIWnLqKNQ-KKWd-2bhFSZCLBJ2_o4I",
  authDomain: "nxrainspireiq.firebaseapp.com",
  projectId: "nxrainspireiq",
  storageBucket: "nxrainspireiq.appspot.com",
  messagingSenderId: "746966772850",
  appId: "nxrainspireiq-web-app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
