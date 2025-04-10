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
import { firestore } from '../config/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Production, ProductionStatus } from '../types';
import ProductionCard from './common/ProductionCard';
import StatusBadge from './common/StatusBadge';

interface StaffRequestListProps {
  producerId: string;
  onSelectProduction: (production: Production) => void;
  filterStatus?: ProductionStatus | 'all';
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
    fetchProductions();
  }, [producerId, filterStatus]);

  const fetchProductions = async () => {
    if (!producerId) return;
    
    setLoading(true);
    try {
      // Build query based on filter status
      let productionsQuery;
      
      if (filterStatus !== 'all') {
        productionsQuery = query(
          collection(firestore, 'productions'),
          where('requestedById', '==', producerId),
          where('status', '==', filterStatus),
          orderBy('date', 'desc')
        );
      } else {
        productionsQuery = query(
          collection(firestore, 'productions'),
          where('requestedById', '==', producerId),
          orderBy('date', 'desc')
        );
      }
      
      const snapshot = await getDocs(productionsQuery);
      
      let productionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime.toDate(),
        callTime: doc.data().callTime.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Production));
      
      // Apply max items limit if specified
      if (maxItems && productionsData.length > maxItems) {
        productionsData = productionsData.slice(0, maxItems);
      }
      
      setProductions(productionsData);
    } catch (error) {
      console.error('Error fetching productions:', error);
      Alert.alert('Error', 'Failed to load production requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProductions();
  };

  const renderProductionItem = ({ item }: { item: Production }) => (
    <ProductionCard
      production={item}
      onPress={() => onSelectProduction(item)}
      rightComponent={
        <View style={styles.statusContainer}>
          <StatusBadge status={item.status} />
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
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
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