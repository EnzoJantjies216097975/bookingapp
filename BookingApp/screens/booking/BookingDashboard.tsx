import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, orderBy, getDocs, Timestamp, limit, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { format, addDays } from 'date-fns';
import { AuthContext } from '../../contexts/AuthContext';
import { Production, User } from '../../types';
import ProductionCard from '../../components/common/ProductionCard';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';

const BookingOfficerDashboard: React.FC = () => {
  const navigation = useNavigation();
  const { userProfile } = useContext(AuthContext);
  
  const [pendingProductions, setPendingProductions] = useState<Production[]>([]);
  const [todayProductions, setTodayProductions] = useState<Production[]>([]);
  const [upcomingProductions, setUpcomingProductions] = useState<Production[]>([]);
  const [staffCounts, setStaffCounts] = useState({
    camera: 0,
    sound: 0,
    lighting: 0,
    other: 0,
    total: 0
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
    
    // Set up realtime listener for pending productions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pendingQuery = query(
      collection(firestore, 'productions'),
      where('status', '==', 'requested'),
      orderBy('date'),
      orderBy('startTime')
    );
    
    const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
      const productions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime.toDate(),
        callTime: doc.data().callTime.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Production));
      
      setPendingProductions(productions);
    });
    
    return () => {
      unsubscribePending();
    };
  }, []);
  
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      // Fetch today's productions
      const todayQuery = query(
        collection(firestore, 'productions'),
        where('date', '>=', Timestamp.fromDate(today)),
        where('date', '<', Timestamp.fromDate(tomorrow)),
        where('status', '==', 'confirmed'),
        orderBy('date'),
        orderBy('startTime')
      );
      
      const todaySnapshot = await getDocs(todayQuery);
      const todayData = todaySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime.toDate(),
        callTime: doc.data().callTime.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Production));
      
      setTodayProductions(todayData);
      
      // Fetch upcoming productions (next 7 days, excluding today)
      const upcomingQuery = query(
        collection(firestore, 'productions'),
        where('date', '>', Timestamp.fromDate(tomorrow)),
        where('date', '<', Timestamp.fromDate(nextWeek)),
        where('status', '==', 'confirmed'),
        orderBy('date'),
        orderBy('startTime'),
        limit(5)
      );
      
      const upcomingSnapshot = await getDocs(upcomingQuery);
      const upcomingData = upcomingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime.toDate(),
        callTime: doc.data().callTime.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Production));
      
      setUpcomingProductions(upcomingData);
      
      // Get staff counts by role
      const staffQuery = query(collection(firestore, 'users'));
      const staffSnapshot = await getDocs(staffQuery);
      
      let cameraCount = 0;
      let soundCount = 0;
      let lightingCount = 0;
      let otherCount = 0;
      
      staffSnapshot.docs.forEach(doc => {
        const userData = doc.data() as User;
        
        if (userData.role === 'camera_operator') {
          cameraCount++;
        } else if (userData.role === 'sound_operator') {
          soundCount++;
        } else if (userData.role === 'lighting_operator') {
          lightingCount++;
        } else if (['evs_operator', 'director', 'stream_operator', 'technician', 'electrician'].includes(userData.role)) {
          otherCount++;
        }
      });
      
      setStaffCounts({
        camera: cameraCount,
        sound: soundCount,
        lighting: lightingCount,
        other: otherCount,
        total: staffSnapshot.size
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };
  
  const renderProductionItem = ({ item }: { item: Production }) => (
    <ProductionCard
      production={item}
      onPress={() => navigation.navigate('ProductionDetails' as never, { productionId: item.id } as never)}
    />
  );
  
  const renderSectionHeader = (title: string, count: number) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{count}</Text>
      </View>
    </View>
  );
  
  const navigateToCalendar = () => {
    navigation.navigate('ProductionCalendar' as never);
  };
  
  const navigateToAnnouncements = () => {
    navigation.navigate('AnnouncementDashboard' as never);
  };
  
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.nameText}>{userProfile?.name || 'Booking Officer'}</Text>
        </View>
        <TouchableOpacity
          style={styles.calendarButton}
          onPress={navigateToCalendar}
        >
          <Icon name="calendar-month" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      ) : (
        <>
          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <TouchableOpacity 
                style={[styles.statCard, { backgroundColor: '#007bff' }]}
                onPress={() => navigation.navigate('StaffList' as never)}
              >
                <Icon name="people" size={24} color="#fff" />
                <Text style={styles.statValue}>{staffCounts.total}</Text>
                <Text style={styles.statLabel}>Total Staff</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.statCard, { backgroundColor: '#28a745' }]}
                onPress={() => navigation.navigate('ProductionList' as never, { status: 'confirmed' } as never)}
              >
                <Icon name="check-circle" size={24} color="#fff" />
                <Text style={styles.statValue}>{upcomingProductions.length}</Text>
                <Text style={styles.statLabel}>Upcoming</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.statsRow}>
              <TouchableOpacity 
                style={[styles.statCard, { backgroundColor: '#ffc107' }]}
                onPress={() => navigation.navigate('ProductionList' as never, { status: 'requested' } as never)}
              >
                <Icon name="pending" size={24} color="#fff" />
                <Text style={styles.statValue}>{pendingProductions.length}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.statCard, { backgroundColor: '#17a2b8' }]}
                onPress={() => navigation.navigate('ProductionList' as never, { status: 'today' } as never)}
              >
                <Icon name="today" size={24} color="#fff" />
                <Text style={styles.statValue}>{todayProductions.length}</Text>
                <Text style={styles.statLabel}>Today</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActionsRow}>
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => navigation.navigate('StaffAssignment' as never)}
              >
                <View style={styles.quickActionIcon}>
                  <Icon name="group-add" size={24} color="#007bff" />
                </View>
                <Text style={styles.quickActionText}>Assign Staff</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => navigation.navigate('SchedulePrinting' as never)}
              >
                <View style={styles.quickActionIcon}>
                  <Icon name="print" size={24} color="#28a745" />
                </View>
                <Text style={styles.quickActionText}>Print Schedule</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={navigateToAnnouncements}
              >
                <View style={styles.quickActionIcon}>
                  <Icon name="campaign" size={24} color="#ffc107" />
                </View>
                <Text style={styles.quickActionText}>Announcement</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => navigation.navigate('ProductionAnalytics' as never)}
              >
                <View style={styles.quickActionIcon}>
                  <Icon name="analytics" size={24} color="#17a2b8" />
                </View>
                <Text style={styles.quickActionText}>Analytics</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Staff Availability */}
          <Card title="Staff Availability" style={styles.staffCard}>
            <View style={styles.staffRow}>
              <View style={styles.staffTypeContainer}>
                <Icon name="videocam" size={20} color="#007bff" />
                <Text style={styles.staffTypeText}>Camera</Text>
              </View>
              <Text style={styles.staffCount}>{staffCounts.camera}</Text>
            </View>
            
            <View style={styles.staffRow}>
              <View style={styles.staffTypeContainer}>
                <Icon name="mic" size={20} color="#28a745" />
                <Text style={styles.staffTypeText}>Sound</Text>
              </View>
              <Text style={styles.staffCount}>{staffCounts.sound}</Text>
            </View>
            
            <View style={styles.staffRow}>
              <View style={styles.staffTypeContainer}>
                <Icon name="wb-sunny" size={20} color="#ffc107" />
                <Text style={styles.staffTypeText}>Lighting</Text>
              </View>
              <Text style={styles.staffCount}>{staffCounts.lighting}</Text>
            </View>
            
            <View style={styles.staffRow}>
              <View style={styles.staffTypeContainer}>
                <Icon name="category" size={20} color="#17a2b8" />
                <Text style={styles.staffTypeText}>Other</Text>
              </View>
              <Text style={styles.staffCount}>{staffCounts.other}</Text>
            </View>
          </Card>
          
          {/* Pending Requests */}
          {pendingProductions.length > 0 && (
            <View style={styles.section}>
              {renderSectionHeader('Pending Requests', pendingProductions.length)}
              
              <FlatList
                data={pendingProductions.slice(0, 3)}
                renderItem={renderProductionItem}
                keyExtractor={item => item.id}
                style={styles.productionList}
                scrollEnabled={false}
              />
              
              {pendingProductions.length > 3 && (
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => navigation.navigate('ProductionList' as never, { status: 'requested' } as never)}
                >
                  <Text style={styles.viewAllText}>View All ({pendingProductions.length})</Text>
                  <Icon name="arrow-forward" size={16} color="#007bff" />
                </TouchableOpacity>