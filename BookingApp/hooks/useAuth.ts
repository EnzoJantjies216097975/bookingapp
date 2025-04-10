import { useState, useEffect, useCallback } from 'react';
import { 
  auth, 
  firestore 
} from '../config/firebase';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { User, UserRole } from '../types';

interface AuthState {
  user: FirebaseUser | null;
  profile: User | null;
  loading: boolean;
  initialized: boolean;
}

interface UseAuthReturn extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole, phoneNumber?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    initialized: false,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await fetchUserProfile(user.uid);
        setState({
          user,
          profile,
          loading: false,
          initialized: true,
        });
      } else {
        setState({
          user: null,
          profile: null,
          loading: false,
          initialized: true,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      if (userDoc.exists()) {
        return {
          id: userId,
          ...userDoc.data()
        } as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const profile = await fetchUserProfile(user.uid);
      setState({
        user,
        profile,
        loading: false,
        initialized: true,
      });
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    name: string, 
    role: UserRole,
    phoneNumber?: string
  ): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      const userData: Omit<User, 'id'> = {
        name,
        email,
        role,
        phoneNumber: phoneNumber || '',
      };
      
      await setDoc(doc(firestore, 'users', user.uid), userData);
      
      const profile = {
        id: user.uid,
        ...userData,
      };
      
      setState({
        user,
        profile,
        loading: false,
        initialized: true,
      });
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      await firebaseSignOut(auth);
      setState({
        user: null,
        profile: null,
        loading: false,
        initialized: true,
      });
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    if (!state.user) throw new Error('No authenticated user');
    
    setState(prev => ({ ...prev, loading: true }));
    try {
      await updateDoc(doc(firestore, 'users', state.user.uid), data);
      
      // Update local state
      const updatedProfile = await fetchUserProfile(state.user.uid);
      setState(prev => ({
        ...prev,
        profile: updatedProfile,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!state.user) return;
    
    setState(prev => ({ ...prev, loading: true }));
    try {
      const profile = await fetchUserProfile(state.user.uid);
      setState(prev => ({
        ...prev,
        profile,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      console.error('Error refreshing profile:', error);
    }
  }, [state.user]);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
  };
};