import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  console.log('🔐 AuthProvider initializing...');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Sign in with Google
  const loginWithGoogle = async () => {
    try {
      console.log('🚀 Attempting Google sign-in...');
      setAuthError(null);
      const result = await signInWithPopup(auth, googleProvider);
      console.log('✅ Google sign-in successful:', result.user.email);
      return result;
    } catch (error) {
      console.error('❌ Google sign-in error:', error);
      setAuthError(error.message);
      
      // Show user-friendly error message
      alert(`Authentication Error: ${error.message}\n\nPlease check the Firebase setup guide (FIREBASE_SETUP.md) to configure authorized domains.`);
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      console.log('👋 User signed out');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      setAuthError(error.message);
    }
  };

  useEffect(() => {
    console.log('👂 Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, 
      (user) => {
        console.log('👤 Auth state changed:', user ? `User: ${user.email}` : 'No user');
        setCurrentUser(user);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Auth state error:', error);
        setAuthError(error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loginWithGoogle,
    logout,
    loading,
    authError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
