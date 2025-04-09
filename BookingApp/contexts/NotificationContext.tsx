import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Platform } from 'react-native';
import { AuthContext } from './AuthContext';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { firestore, functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import messaging from '@react-native-firebase/messaging';
import { Notification as NotificationType } from '../types';

interface NotificationContextType {
  notifications: NotificationType[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  loading: boolean;
}

export const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  requestPermission: async () => false,
  loading: true
});

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Listen for notifications for this user
    const unsubscribe = onSnapshot(
      query(
        collection(firestore, 'notifications'),
        where('recipientId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const notificationData: NotificationType[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        } as NotificationType));
        
        setNotifications(notificationData);
        setUnreadCount(notificationData.filter(n => !n.read).length);
        setLoading(false);
      }
    );

    // Register device token for push notifications
    registerDeviceToken();

    // Set up foreground message handler
    const unsubscribeMessaging = messaging().onMessage(async remoteMessage => {
      // Handle foreground notifications
      console.log('Foreground notification received:', remoteMessage);
    });

    return () => {
      unsubscribe();
      unsubscribeMessaging();
    };
  }, [currentUser]);

  const registerDeviceToken = async () => {
    if (!currentUser) return;

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
  };

  const markAsRead = async (notificationId: string): Promise<void> => {
    try {
      await firestore
        .collection('notifications')
        .doc(notificationId)
        .update({ read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    if (!currentUser) return;
    
    try {
      const batch = firestore.batch();
      const unreadNotifications = await firestore
        .collection('notifications')
        .where('recipientId', '==', currentUser.uid)
        .where('read', '==', false)
        .get();
      
      unreadNotifications.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    requestPermission,
    loading
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};