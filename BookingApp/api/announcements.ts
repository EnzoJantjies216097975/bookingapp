import { firestore } from '../config/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, serverTimestamp } from 'firebase/firestore';
import { Announcement } from '../types';

// Convert Firestore data to Announcement object
const convertFirestoreAnnouncement = (doc: any): Announcement => ({
  id: doc.id,
  ...doc.data(),
  createdAt: doc.data().createdAt?.toDate() || new Date()
});

// Get all announcements
export const getAllAnnouncements = async (): Promise<Announcement[]> => {
  try {
    const announcementsRef = collection(firestore, 'announcements');
    const q = query(
      announcementsRef,
      orderBy('isPinned', 'desc'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertFirestoreAnnouncement(doc));
  } catch (error) {
    console.error('Error fetching announcements:', error);
    throw error;
  }
};

// Get announcements for specific target group
export const getAnnouncementsByTarget = async (targetGroup: 'all' | 'producers' | 'operators'): Promise<Announcement[]> => {
  try {
    const announcementsRef = collection(firestore, 'announcements');
    const q = query(
      announcementsRef,
      where('targetGroup', 'in', [targetGroup, 'all']),
      orderBy('isPinned', 'desc'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertFirestoreAnnouncement(doc));
  } catch (error) {
    console.error('Error fetching announcements by target:', error);
    throw error;
  }
};

// Get announcement by ID
export const getAnnouncementById = async (id: string): Promise<Announcement | null> => {
  try {
    const docRef = doc(firestore, 'announcements', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return convertFirestoreAnnouncement(docSnap);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching announcement by ID:', error);
    throw error;
  }
};

// Create a new announcement
export interface CreateAnnouncementData {
  title: string;
  message: string;
  targetGroup: 'all' | 'producers' | 'operators';
  createdById: string;
  isPinned?: boolean;
}

export const createAnnouncement = async (data: CreateAnnouncementData): Promise<string> => {
  try {
    const announcementData = {
      ...data,
      isPinned: data.isPinned || false,
      createdAt: serverTimestamp()
    };
    
    const announcementsRef = collection(firestore, 'announcements');
    const docRef = await addDoc(announcementsRef, announcementData);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }
};

// Update an announcement
export interface UpdateAnnouncementData {
  title?: string;
  message?: string;
  targetGroup?: 'all' | 'producers' | 'operators';
  isPinned?: boolean;
}

export const updateAnnouncement = async (id: string, data: UpdateAnnouncementData): Promise<void> => {
  try {
    const announcementRef = doc(firestore, 'announcements', id);
    await updateDoc(announcementRef, data);
  } catch (error) {
    console.error('Error updating announcement:', error);
    throw error;
  }
};

// Toggle pinned status
export const toggleAnnouncementPin = async (id: string, isPinned: boolean): Promise<void> => {
  try {
    const announcementRef = doc(firestore, 'announcements', id);
    await updateDoc(announcementRef, { isPinned });
  } catch (error) {
    console.error('Error toggling announcement pin:', error);
    throw error;
  }
};

// Delete an announcement
export const deleteAnnouncement = async (id: string): Promise<void> => {
  try {
    const announcementRef = doc(firestore, 'announcements', id);
    await deleteDoc(announcementRef);
  } catch (error) {
    console.error('Error deleting announcement:', error);
    throw error;
  }
};