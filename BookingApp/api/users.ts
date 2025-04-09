import { firestore } from '../config/firebase';
import { collection, doc, getDoc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { User, UserRole } from '../types';

// Get all users
export const getAllUsers = async (): Promise<User[]> => {
  const usersRef = collection(firestore, 'users');
  const snapshot = await getDocs(usersRef);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as User));
};

// Get user by ID
export const getUserById = async (userId: string): Promise<User | null> => {
  const userRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    return null;
  }
  
  return {
    id: userId,
    ...userDoc.data()
  } as User;
};

// Get users by role
export const getUsersByRole = async (role: UserRole): Promise<User[]> => {
  const usersRef = collection(firestore, 'users');
  const q = query(usersRef, where('role', '==', role));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as User));
};

// Update user's device token for push notifications
export const updateUserDeviceToken = async (userId: string, token: string): Promise<void> => {
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, { deviceToken: token });
};

// Check if user exists
export const checkUserExists = async (email: string): Promise<boolean> => {
  const usersRef = collection(firestore, 'users');
  const q = query(usersRef, where('email', '==', email));
  const snapshot = await getDocs(q);
  
  return !snapshot.empty;
};

// Get user names by IDs (batch lookup)
export const getUserNamesByIds = async (userIds: string[]): Promise<Record<string, string>> => {
  const result: Record<string, string> = {};
  
  // Use Promise.all for parallel requests
  await Promise.all(
    userIds.map(async (userId) => {
      if (!userId) return;
      
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      if (userDoc.exists()) {
        result[userId] = userDoc.data().name || 'Unknown';
      } else {
        result[userId] = 'Unknown';
      }
    })
  );
  
  return result;
};

// Update user profile
export interface UpdateUserData {
  name?: string;
  phoneNumber?: string;
  profilePicture?: string;
  role?: UserRole;
}

export const updateUser = async (userId: string, data: UpdateUserData): Promise<void> => {
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, data);
};