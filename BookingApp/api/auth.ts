import { auth, firestore } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword as firebaseSignIn, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { User, UserRole } from '../types';

// Sign up a new user
export interface SignUpData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phoneNumber?: string;
}

export const signUp = async (data: SignUpData): Promise<User> => {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const firebaseUser = userCredential.user;
    
    // Create user document in Firestore
    const userData: Omit<User, 'id'> = {
      name: data.name,
      email: data.email,
      role: data.role,
      phoneNumber: data.phoneNumber || '',
    };
    
    await setDoc(doc(firestore, 'users', firebaseUser.uid), userData);
    
    return {
      id: firebaseUser.uid,
      ...userData
    };
  } catch (error) {
    throw error;
  }
};

// Sign in
export const signIn = async (email: string, password: string): Promise<FirebaseUser> => {
  try {
    const userCredential = await firebaseSignIn(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    throw error;
  }
};

// Get current user profile
export const getCurrentUser = async (): Promise<User | null> => {
  const firebaseUser = auth.currentUser;
  
  if (!firebaseUser) {
    return null;
  }
  
  const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
  
  if (!userDoc.exists()) {
    return null;
  }
  
  return {
    id: firebaseUser.uid,
    ...userDoc.data()
  } as User;
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
};

// Update user password
export const updateUserPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const firebaseUser = auth.currentUser;
  
  if (!firebaseUser || !firebaseUser.email) {
    throw new Error('No authenticated user');
  }
  
  try {
    // Reauthenticate user before changing password
    const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
    await reauthenticateWithCredential(firebaseUser, credential);
    
    // Update password
    await updatePassword(firebaseUser, newPassword);
  } catch (error) {
    throw error;
  }
};

// Update user profile
export interface UpdateProfileData {
  name?: string;
  phoneNumber?: string;
  profilePicture?: string;
}

export const updateUserProfile = async (data: UpdateProfileData): Promise<void> => {
  const firebaseUser = auth.currentUser;
  
  if (!firebaseUser) {
    throw new Error('No authenticated user');
  }
  
  try {
    await updateDoc(doc(firestore, 'users', firebaseUser.uid), data);
  } catch (error) {
    throw error;
  }
};