import React, { useContext, useEffect, useState } from 'react';
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
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { format } from 'date-fns';
import { AuthContext } from '../../contexts/AuthContext';
import { Production, RootStackParamList, UserRole } from '../../types';
import ProductionCard from '../../components/common/ProductionCard';

type OperatorDashboardNavigationProp = StackNavigationProp<
  RootStackParamList,
  'OperatorDashboard'
>;

interface OperatorDashboardProps {
  navigation: OperatorDashboardNavigationProp;
}

const OperatorDashboard: React.FC<OperatorDashboardProps> = ({ navigation }) => {
  const { userProfile } = useContext(AuthContext);
  const [todayProductions, setTodayProductions] = useState<Production[]>([]);
  const [upcomingProductions, setUpcomingProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    if (!userProfile) return;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Helper function to create queries for different staff roles
    const createQueries = (startDate: Date, endDate: Date) => {
      const fieldMapping: Record<UserRole, string> = {
        'camera_operator': 'assignedStaff.cameraOperators',
        'sound_operator': 'assignedStaff.soundOperators',
        'lighting_operator': 'assignedStaff.lightingOperators',
        'evs_operator': 'assignedStaff.evsOperator',
        'director': 'assignedStaff.director',
        'stream_operator': 'assignedStaff.streamOperator',
        'technician': 'assignedStaff.technician',
        'electrician': 'assignedStaff.electrician',
        'producer': 'requestedById',
        'booking_officer': 'processedById'
      };

      const field = fieldMapping[userProfile.role];
      
      if (field.endsWith('s')) {
        // For array fields (operators with multiple staff)
        return query(
          collection(firestore, 'productions'),
          where(field, 'array-contains', userProfile.id),
          where('date', '>=', Timestamp.fromDate(startDate)),
          where('date', '<', Timestamp.fromDate(endDate)),
          where('status', '==', 'confirmed'),
          orderBy('date'),
          orderBy('startTime')
        );
      } else {
        // For single value fields
        return query(
          collection(firestore, 'productions'),
          where(field, '==', userProfile.id),
          where('date', '>=', Timestamp.fromDate(startDate)),
          where('date', '<', Timestamp.fromDate(endDate)),
          where('status', '==', 'confirmed'),
          orderBy('date'),
          orderBy('startTime')
        );
      }
    };
    
    // Today's productions
    const unsubscribeToday = onSnapshot(
      createQueries(today, tomorrow),
      (snapshot) => {
        const productions: Production[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate(),
          startTime: doc.data().startTime.toDate(),
          endTime: doc.data().endTime.toDate(),
          callTime: doc.data().callTime.toDate(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        } as Production));
        
        setTodayProductions(productions);
      }
    );
    
    // Future productions (excluding today)
    const unsubscribeUpcoming = onSnapshot(
      createQueries(tomorrow, new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())),
      (snapshot) => {
        const productions: Production[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate(),
          startTime: doc.data().startTime.toDate(),
          endTime: doc.data().endTime.toDate(),
          callTime: doc.data().callTime.toDate(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        } as Production));
        
        setUpcomingProductions(productions);
        setLoading(false);
        setRefreshing(false);
      }
    );
    
    return () => {
      unsubscribeToday();
      unsubscribeUpcoming();
    };
  }, [userProfile]);

  const handleReportIssue = (production: Production) => {
    navigation.navigate('IssueReporting', { productionId: production.id });
  };

  const onRefresh = () => {
    setRefreshing(true);
    // The onSnapshot listeners will refresh the data automatically
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
      ) : (
        <FlatList
          data={[
            { title: "Today's Productions", data: todayProductions },
            { title: 'Upcoming Productions', data: upcomingProductions }
          ]}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View>
              <Text style={styles.sectionTitle}>{item.title}</Text>
              {item.data.length === 0 ? (
                <Text style={styles.emptyText}>
                  {item.title === "Today's Productions"
                    ? 'No productions scheduled for today'
                    : 'No upcoming productions'}
                </Text>
              ) : (
                <FlatList
                  data={item.data}
                  keyExtractor={production => production.id}
                  renderItem={({ item: production }) => (
                    <ProductionCard
                      production={production}
                      onPress={() => navigation.navigate('ProductionDetails', { productionId: production.id })}
                      rightComponent={
                        <TouchableOpacity
                          style={styles.issueButton}
                          onPress={() => handleReportIssue(production)}
                        >
                          <Icon name="report-problem" size={20} color="#fff" />
                        </TouchableOpacity>
                      }
                    />
                  )}
                  style={styles.productionList}
                />
              )}
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: '#17a2b8' }]}
          onPress={() => navigation.navigate('ProductionHistory')}
        >
          <Icon name="history" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  productionList: {
    paddingHorizontal: 16,
  },
  issueButton: {
    backgroundColor: '#dc3545',
    padding: 8,
    borderRadius: 4,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 20,
    color: '#666',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default OperatorDashboard;