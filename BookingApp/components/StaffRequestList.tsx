import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Production } from '../types';
import ProductionCard from '../components/common/ProductionCard';
import StatusBadge from '../components/common/StatusBadge';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface StaffRequestListProps {
  producerId: string;
  onSelectProduction: (production: Production) => void;
  filterStatus?: 'all' | 'requested' | 'confirmed';
  maxItems?: number;
  showEmptyMessage?: boolean;
  emptyMessage?: string;
  title?: string;
}

const StaffRequestList: React.FC<StaffRequestListProps> = ({
  producerId,
  onSelectProduction,
  filterStatus = 'all',
  maxItems,
  showEmptyMessage = true,
  emptyMessage = 'No productions found',
  title
}) => {
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    if (!producerId) return;
    
    // Build the query based on the filter status
    let productionsQuery = query(
      collection(firestore, 'productions'),
      where('requestedById', '==', producerId),
      orderBy('date', 'desc')
    );
    
    if (filterStatus !== 'all') {
      productionsQuery = query(
        collection(firestore, 'productions'),
        where('requestedById', '==', producerId),
        where('status', '==', filterStatus),
        orderBy('date', 'desc')
      );
    }
    
    const unsubscribe = onSnapshot(
      productionsQuery,
      (snapshot) => {
        const productionData: Production[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate(),
          startTime: doc.data().startTime.toDate(),
          endTime: doc.data().endTime.toDate(),
          callTime: doc.data().callTime.toDate(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        } as Production));
        
        // Apply maxItems limit if specified
        if (maxItems && productionData.length > maxItems) {
          setProductions(productionData.slice(0, maxItems));
        } else {
          setProductions(productionData);
        }
        
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error fetching productions:', error);
        Alert.alert('Error', 'Failed to load production requests');
        setLoading(false);
        setRefreshing(false);
      }
    );
    
    return () => unsubscribe();
  }, [producerId, filterStatus, maxItems]);

  const onRefresh = () => {
    setRefreshing(true);
  };

  const renderProductionItem = ({ item: production }: { item: Production }) => (
    <ProductionCard
      production={production}
      onPress={() => onSelectProduction(production)}
      rightComponent={
        <View style={styles.statusContainer}>
          <StatusBadge status={production.status} />
        </View>
      }
    />
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {title && <Text style={styles.listTitle}>{title}</Text>}
      
      {productions.length === 0 && showEmptyMessage ? (
        <View style={styles.emptyContainer}>
          <Icon name="event-busy" size={48} color="#ccc" />
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : (
        <FlatList
          data={productions}
          renderItem={renderProductionItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  },
  statusContainer: {
    marginLeft: 8,
  }
});

export default StaffRequestList;