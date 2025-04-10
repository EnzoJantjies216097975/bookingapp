import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../contexts/AuthContext';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../api/notifications';
import { Notification } from '../../types';

type NotificationsScreenNavigationProp = StackNavigationProp<any>;

interface NotificationsScreenProps {
  navigation: NotificationsScreenNavigationProp;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const { userProfile } = useContext(AuthContext);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  useEffect(() => {
    if (userProfile) {
      fetchNotifications();
    }
  }, [userProfile]);
  
  const fetchNotifications = async () => {
    if (!userProfile) return;
    
    try {
      setLoading(true);
      const userNotifications = await getUserNotifications(userProfile.id);
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };
  
  const handleNotificationPress = async (notification: Notification) => {
    try {
      // Mark as read
      if (!notification.read) {
        await markNotificationAsRead(notification.id);
        
        // Update local state
        setNotifications(prevNotifications =>
          prevNotifications.map(n =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
      }
      
      // Navigate based on notification type
      if (notification.type === 'assignment' && notification.productionId) {
        navigation.navigate('ProductionDetails', { productionId: notification.productionId });
      } else if (notification.type === 'issue' && notification.productionId) {
        navigation.navigate('ProductionDetails', { productionId: notification.productionId });
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if (!userProfile) return;
    
    try {
      await markAllNotificationsAsRead(userProfile.id);
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(n => ({ ...n, read: true }))
      );
      
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };
  
  const getNotificationIcon = (type: string): { name: string; color: string } => {
    switch (type) {
      case 'assignment':
        return { name: 'assignment', color: '#2196F3' };
      case 'confirmation':
        return { name: 'check-circle', color: '#4CAF50' };
      case 'reminder':
        return { name: 'alarm', color: '#FF9800' };
      case 'issue':
        return { name: 'report-problem', color: '#F44336' };
      case 'overtime':
        return { name: 'schedule', color: '#9C27B0' };
      default:
        return { name: 'notifications', color: '#607D8B' };
    }
  };
  
  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const { name, color } = getNotificationIcon(item.type);
    
    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.read && styles.unreadNotification]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Icon name={name} size={24} color="#fff" />
        </View>
        
        <View style={styles.notificationContent}>
          <Text style={[styles.notificationMessage, !item.read && styles.unreadText]}>
            {item.message}
          </Text>
          <Text style={styles.notificationTime}>
            {format(item.createdAt, 'MMM d, yyyy h:mm a')}
          </Text>
        </View>
        
        {!item.read && <View style={styles.unreadIndicator} />}
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {notifications.some(n => !n.read) && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllText}>Mark All as Read</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="notifications-off" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No notifications</Text>
          <Text style={styles.emptySubtext}>You don't have any notifications yet.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    color: '#007bff',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  listContainer: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  unreadNotification: {
    backgroundColor: '#f0f7ff',
    elevation: 2,
    shadowOpacity: 0.2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: 'bold',
    color: '#000',
  },
  notificationTime: {
    fontSize: 12,
    color: '#777',
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007bff',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  }
});

export default NotificationsScreen;