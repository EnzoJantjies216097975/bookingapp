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
import { Production, RootStackParamList } from '../../types';
import ProductionCard from '../../components/common/ProductionCard';

type ProducerDashboardNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ProducerDashboard'
>;

interface ProducerDashboardProps {
  navigation: ProducerDashboardNavigationProp;
}

const ProducerDashboard: React.FC<ProducerDashboardProps> = ({ navigation }) => {
  const { userProfile } = useContext(AuthContext);
  const [pendingProductions, setPendingProductions] = useState<Production[]>([]);
  const [upcomingProductions, setUpcomingProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    if (!userProfile) return;
    
    const now = new Date();
    
    // Fetch pending productions (requested but not confirmed)
    const unsubscribePending = onSnapshot(
      query(
        collection(firestore, 'productions'),
        where('requestedById', '==', userProfile.id),
        where('status', '==', 'requested'),
        orderBy('date')
      ),
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
        
        setPendingProductions(productions);
      }
    );
    
    // Fetch upcoming productions (confirmed and in the future)
    const unsubscribeUpcoming = onSnapshot(
      query(
        collection(firestore, 'productions'),
        where('requestedById', '==', userProfile.id),
        where('status', '==', 'confirmed'),
        where('date', '>=', Timestamp.fromDate(now)),
        orderBy('date')
      ),
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
      unsubscribePending();
      unsubscribeUpcoming();
    };
  }, [userProfile]);

  const handleReportOvertime = (production: Production) => {
    // Check if production is currently active
    const now = new Date();
    const productionDate = new Date(production.date);
    const isSameDay = now.toDateString() === productionDate.toDateString();
    const productionEndTime = new Date(production.endTime);
    
    if (!isSameDay || now < productionEndTime) {
      Alert.alert(
        'Cannot Report Overtime',
        'Overtime can only be reported after the scheduled end time on the day of production.'
      );
      return;
    }
    
    // Navigate to overtime reporting screen
    navigation.navigate('ReportOvertime', { productionId: production.id });
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
            { title: 'Pending Requests', data: pendingProductions },
            { title: 'Upcoming Productions', data: upcomingProductions }
          ]}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View>
              <Text style={styles.sectionTitle}>{item.title}</Text>
              {item.data.length === 0 ? (
                <Text style={styles.emptyText}>
                  {item.title === 'Pending Requests'
                    ? 'No pending production requests'
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
                        item.title === 'Upcoming Productions' ? (
                          <TouchableOpacity
                            style={styles.overtimeButton}
                            onPress={() => handleReportOvertime(production)}
                          >
                            <Text style={styles.overtimeButtonText}>Report OT</Text>
                          </TouchableOpacity>
                        ) : null
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
          style={styles.fab}
          onPress={() => navigation.navigate('NewProductionRequest')}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: '#17a2b8', marginTop: 12 }]}
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
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 20,
    color: '#666',
  },
  overtimeButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  overtimeButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default ProducerDashboard;