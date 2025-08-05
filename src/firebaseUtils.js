import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Save idea to Firestore
export const saveIdeaToFirestore = async (ideaData, currentUser) => {
  console.log('🔥 Attempting to save to Firestore...');
  console.log('Current user:', currentUser);
  console.log('Idea data:', ideaData);
  
  if (!currentUser) {
    console.warn('⚠️ No authenticated user - skipping Firestore save');
    return null;
  }
  
  try {
    const dataToSave = {
      ...ideaData,
      userId: currentUser.uid,
      userEmail: currentUser.email,
      userName: currentUser.displayName || ideaData.name,
      timestamp: serverTimestamp()
    };
    
    console.log('📝 Data being saved:', dataToSave);
    
    const docRef = await addDoc(collection(db, 'ideas'), dataToSave);
    
    console.log('✅ Idea saved to Firestore with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving idea to Firestore:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw error;
  }
};
