import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Platform } from 'react-native';
import { firestore, functions } from '../config/firebase';
import { Notification } from '../types';
import messaging from '@react-native-firebase/messaging';

interface UseNotificationsProps {
  userId: string | undefined;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  registerDeviceToken: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  refreshNotifications: () => void;
}

export const useNotifications = ({ userId }: UseNotificationsProps): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return () => {};
    }

    const notificationsRef = collection(firestore, 'notifications');
    const q = query(
      notificationsRef,
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList: Notification[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }) as Notification);

      setNotifications(notificationsList);
      setUnreadCount(notificationsList.filter(n => !n.read).length);
      setLoading(false);
    });

    setupForegroundNotificationHandler();
    registerDeviceToken();

    return () => unsubscribe();
  }, [userId]);

  const setupForegroundNotificationHandler = () => {
    if (Platform.OS !== 'web') {
      const unsubscribe = messaging().onMessage(async (remoteMessage) => {
        console.log('Foreground notification received:', remoteMessage);
        // Implement a visual notification if needed
        refreshNotifications();
      });
      
      return () => unsubscribe();
    }
  };

  const markAsRead = async (notificationId: string): Promise<void> => {
    if (!userId) return;
    
    try {
      await updateDoc(doc(firestore, 'notifications', notificationId), { read: true });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    if (!userId) return;
    
    try {
      const markAllNotificationsAsRead = httpsCallable(functions, 'markAllNotificationsAsRead');
      await markAllNotificationsAsRead({ userId });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };

  const registerDeviceToken = async (): Promise<void> => {
    if (!userId || Platform.OS === 'web') return;
    
    try {
      const token = await messaging().getToken();
      if (token) {
        const updateDeviceToken = httpsCallable(functions, 'updateDeviceToken');
        await updateDeviceToken({ token });
      }
    } catch (error) {
      console.error('Error registering device token:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;
    
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled = 
          authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        
        if (enabled) {
          registerDeviceToken();
        }
        
        return enabled;
      } else {
        // On Android, permissions are granted by default
        return true;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const refreshNotifications = useCallback(() => {
    setLoading(true);
    // The onSnapshot listener will update the state automatically
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    registerDeviceToken,
    requestPermission,
    refreshNotifications,
  };
};