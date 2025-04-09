import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { firestore, functions } from '../../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../contexts/AuthContext';
import { Production, RootStackParamList } from '../../types';
import ProductionCard from '../../components/common/ProductionCard';

type BookingDashboardNavigationProp = StackNavigationProp<
  RootStackParamList,
  'BookingDashboard'
>;

interface BookingDashboardProps {
  navigation: BookingDashboardNavigationProp;
}

const BookingDashboard: React.FC<BookingDashboardProps> = ({ navigation }) => {
  const { userProfile } = useContext(AuthContext);
  const [pendingProductions, setPendingProductions] = useState<Production[]>([]);
  const [confirmedProductions, setConfirmedProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    const now = new Date();
    
    // Listen for pending production requests
    const unsubscribePending = onSnapshot(
      query(
        collection(firestore, 'productions'),
        where('status', '==', 'requested'),
        orderBy('date'),
        orderBy('startTime')
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
    
    // Listen for upcoming confirmed productions
    const unsubscribeConfirmed = onSnapshot(
      query(
        collection(firestore, 'productions'),
        where('status', '==', 'confirmed'),
        where('date', '>=', Timestamp.fromDate(now)),
        orderBy('date'),
        orderBy('startTime'),
        where('processedById', '==', userProfile?.id)
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
        
        setConfirmedProductions(productions);
        setLoading(false);
        setRefreshing(false);
      }
    );
    
    return () => {
      unsubscribePending();
      unsubscribeConfirmed();
    };
  }, [userProfile]);

  const handleAssignStaff = (production: Production) => {
    navigation.navigate('StaffAssignment', { production });
  };

  const handlePrintOptions = (production: Production) => {
    Alert.alert(
      'Print Options',
      'Choose a print format',
      [
        { 
          text: 'Print This Production', 
          onPress: () => generatePDF('single', production.id) 
        },
        { 
          text: 'Print Daily Schedule', 
          onPress: () => generatePDF('daily', null, production.date) 
        },
        { 
          text: 'Print Weekly Schedule', 
          onPress: () => {
            const startOfWeek = new Date(production.date);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            generatePDF('weekly', null, null, startOfWeek);
          } 
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const generatePDF = async (
    type: 'single' | 'daily' | 'weekly', 
    productionId?: string, 
    date?: Date, 
    startOfWeek?: Date
  ) => {
    try {
      setLoading(true);
      const generateSchedulePDF = httpsCallable(functions, 'generateSchedulePDF');
      const result = await generateSchedulePDF({
        type,
        productionId,
        date: date ? date.toISOString() : null,
        startOfWeek: startOfWeek ? startOfWeek.toISOString() : null
      });
      
      if (result.data.format === 'html') {
        navigation.navigate('PrintPreview', { 
          html: result.data.content,
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Schedule`
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate schedule');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    // No need to do anything here as the onSnapshot listeners will update the data
    // This just provides visual feedback to the user
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
            { title: 'Pending Requests', data: pendingProductions, isPending: true },
            { title: 'Upcoming Confirmed Productions', data: confirmedProductions, isPending: false }
          ]}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View>
              <Text style={styles.sectionTitle}>{item.title}</Text>
              {item.data.length === 0 ? (
                <Text style={styles.emptyText}>
                  {item.isPending 
                    ? 'No pending production requests' 
                    : 'No upcoming confirmed productions'}
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
                        item.isPending ? (
                          <TouchableOpacity
                            style={styles.assignButton}
                            onPress={() => handleAssignStaff(production)}
                          >
                            <Text style={styles.assignButtonText}>Assign Staff</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={styles.printButton}
                            onPress={() => handlePrintOptions(production)}
                          >
                            <Icon name="print" size={20} color="#fff" />
                          </TouchableOpacity>
                        )
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
          style={[styles.fab, { backgroundColor: '#28a745' }]}
          onPress={() => navigation.navigate('SchedulePrinting')}
        >
          <Icon name="print" size={24} color="#fff" />
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
  assignButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  assignButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  printButton: {
    backgroundColor: '#28a745',
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

export default BookingDashboard;