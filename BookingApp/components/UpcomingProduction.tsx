import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Alert
} from 'react-native';
import { format } from 'date-fns';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Production } from '../types';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface UpcomingProductionProps {
  userId: string;
  userRole: string;
  onPress: (production: Production) => void;
}

const UpcomingProduction: React.FC<UpcomingProductionProps> = ({
  userId,
  userRole,
  onPress
}) => {
  const [nextProduction, setNextProduction] = useState<Production | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) return;
    
    const fetchNextProduction = async () => {
      try {
        setLoading(true);
        
        // Get current date at midnight
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Build query based on user role
        let productionQuery;
        
        if (userRole === 'producer') {
          productionQuery = query(
            collection(firestore, 'productions'),
            where('requestedById', '==', userId),
            where('status', '==', 'confirmed'),
            where('date', '>=', Timestamp.fromDate(today)),
            orderBy('date'),
            orderBy('startTime'),
            limit(1)
          );
        } else if (userRole === 'booking_officer') {
          productionQuery = query(
            collection(firestore, 'productions'),
            where('status', '==', 'confirmed'),
            where('date', '>=', Timestamp.fromDate(today)),
            orderBy('date'),
            orderBy('startTime'),
            limit(1)
          );
        } else {
          // For crew members, we need to query based on their specific role
          const staffField = getStaffFieldByRole(userRole);
          
          if (staffField.endsWith('s')) {
            // For array fields (operators with multiple staff)
            productionQuery = query(
              collection(firestore, 'productions'),
              where(staffField, 'array-contains', userId),
              where('status', '==', 'confirmed'),
              where('date', '>=', Timestamp.fromDate(today)),
              orderBy('date'),
              orderBy('startTime'),
              limit(1)
            );
          } else {
            // For single value fields
            productionQuery = query(
              collection(firestore, 'productions'),
              where(staffField, '==', userId),
              where('status', '==', 'confirmed'),
              where('date', '>=', Timestamp.fromDate(today)),
              orderBy('date'),
              orderBy('startTime'),
              limit(1)
            );
          }
        }
        
        const snapshot = await getDocs(productionQuery);
        
        if (!snapshot.empty) {
          const production = snapshot.docs[0];
          setNextProduction({
            id: production.id,
            ...production.data(),
            date: production.data().date.toDate(),
            startTime: production.data().startTime.toDate(),
            endTime: production.data().endTime.toDate(),
            callTime: production.data().callTime.toDate(),
            createdAt: production.data().createdAt?.toDate() || new Date()
          } as Production);
        }
      } catch (error) {
        console.error('Error fetching next production:', error);
        Alert.alert('Error', 'Failed to fetch upcoming production');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNextProduction();
  }, [userId, userRole]);

  // Helper to map user role to the correct field in productions collection
  const getStaffFieldByRole = (role: string): string => {
    switch (role) {
      case 'camera_operator': return 'assignedStaff.cameraOperators';
      case 'sound_operator': return 'assignedStaff.soundOperators';
      case 'lighting_operator': return 'assignedStaff.lightingOperators';
      case 'evs_operator': return 'assignedStaff.evsOperator';
      case 'director': return 'assignedStaff.director';
      case 'stream_operator': return 'assignedStaff.streamOperator';
      case 'technician': return 'assignedStaff.technician';
      case 'electrician': return 'assignedStaff.electrician';
      default: return '';
    }
  };

  // Get background and icon based on venue type
  const getVenueAssets = (venue: string, isOutsideBroadcast: boolean) => {
    if (isOutsideBroadcast) {
      return {
        backgroundImage: require('../assets/images/outside-broadcast.jpg'),
        icon: 'location-on'
      };
    }
    
    if (venue.startsWith('Studio')) {
      return {
        backgroundImage: require('../assets/images/studio.jpg'),
        icon: 'videocam'
      };
    }
    
    return {
      backgroundImage: require('../assets/images/default-venue.jpg'),
      icon: 'business'
    };
  };

  // Calculate days until production
  const getDaysUntil = (date: Date): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    const diffTime = date.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <Card style={styles.loadingCard}>
        <LoadingSpinner visible={true} text="Loading upcoming production..." />
      </Card>
    );
  }

  if (!nextProduction) {
    return (
      <Card style={styles.emptyCard}>
        <Icon name="event-busy" size={48} color="#ccc" />
        <Text style={styles.emptyText}>No upcoming productions</Text>
      </Card>
    );
  }

  const { backgroundImage, icon } = getVenueAssets(
    nextProduction.venue,
    nextProduction.isOutsideBroadcast
  );
  
  const daysUntil = getDaysUntil(nextProduction.date);
  const isToday = daysUntil === 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(nextProduction)}
      activeOpacity={0.9}
    >
      <ImageBackground
        source={backgroundImage}
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View style={styles.overlay}>
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.badge}>
                {isToday ? (
                  <Text style={styles.badgeText}>TODAY</Text>
                ) : (
                  <Text style={styles.badgeText}>{`IN ${daysUntil} DAYS`}</Text>
                )}
              </View>
              
              <View style={styles.venueContainer}>
                <Icon name={icon} size={16} color="#fff" />
                <Text style={styles.venueText}>{nextProduction.venue}</Text>
              </View>
            </View>
            
            <Text style={styles.title}>{nextProduction.name}</Text>
            
            <View style={styles.timeInfo}>
              <Text style={styles.dateText}>
                {format(nextProduction.date, 'EEE, MMMM d, yyyy')}
              </Text>
              <Text style={styles.timeText}>
                {format(nextProduction.startTime, 'h:mm a')} - {format(nextProduction.endTime, 'h:mm a')}
              </Text>
            </View>
            
            <View style={styles.callTime}>
              <Icon name="access-time" size={16} color="#007bff" />
              <Text style={styles.callTimeText}>
                Call time: {format(nextProduction.callTime, 'h:mm a')}
              </Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  background: {
    flex: 1,
  },
  backgroundImage: {
    borderRadius: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#007bff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 14,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  timeInfo: {
    marginBottom: 8,
  },
  dateText: {
    color: '#ddd',
    fontSize: 14,
    marginBottom: 2,
  },
  timeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  callTime: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  callTimeText: {
    color: '#333',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingCard: {
    height: 180,
    marginHorizontal: 16,
    marginVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    height: 180,
    marginHorizontal: 16,
    marginVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  }
});

export default UpcomingProduction;