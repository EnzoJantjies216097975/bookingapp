import { firestore, functions } from '../config/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Notification, NotificationType } from '../types';

// Convert Firestore data to Notification object
const convertFirestoreNotification = (doc: any): Notification => ({
  id: doc.id,
  ...doc.data(),
  createdAt: doc.data().createdAt?.toDate() || new Date()
});

// Get notifications for a user
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  const notificationsRef = collection(firestore, 'notifications');
  const q = query(
    notificationsRef,
    where('recipientId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => convertFirestoreNotification(doc));
};

// Get unread notifications count
export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
  const notificationsRef = collection(firestore, 'notifications');
  const q = query(
    notificationsRef,
    where('recipientId', '==', userId),
    where('read', '==', false)
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.size;
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const notificationRef = doc(firestore, 'notifications', notificationId);
  await updateDoc(notificationRef, { read: true });
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  const updateDeviceToken = httpsCallable(functions, 'markAllNotificationsAsRead');
  await updateDeviceToken({ userId });
};

// Create a notification
export interface CreateNotificationData {
  recipientId: string;
  productionId?: string;
  type: NotificationType;
  message: string;
}

export const createNotification = async (data: CreateNotificationData): Promise<string> => {
  const notificationData = {
    ...data,
    read: false,
    createdAt: Timestamp.now()
  };
  
  const notificationsRef = collection(firestore, 'notifications');
  const docRef = await addDoc(notificationsRef, notificationData);
  
  return docRef.id;
};

// Send a push notification
export const sendPushNotification = async (
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> => {
  const sendNotification = httpsCallable(functions, 'sendPushNotification');
  await sendNotification({
    userId,
    notification: {
      title,
      body
    },
    data
  });
};