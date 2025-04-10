import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Alert
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { firestore } from '../../config/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { AuthContext } from '../../contexts/AuthContext';
import { Production, ProductionStatus, RootStackParamList } from '../../types';
import ProductionCard from '../../components/common/ProductionCard';

type ProductionListScreenNavigationProp = StackNavigationProp
  RootStackParamList,
  'ProductionList'
>;

type ProductionListScreenRouteProp = RouteProp
  RootStackParamList,
  'ProductionList'
>;

interface ProductionListScreenProps {
  navigation: ProductionListScreenNavigationProp;
  route: ProductionListScreenRouteProp;
}

const ProductionListScreen: React.FC<ProductionListScreenProps> = ({ navigation, route }) => {
  const { userProfile } = useContext(AuthContext);
  const initialStatus = route.params?.status || 'all';
  const title = route.params?.title || 'Productions';
  
  const [productions, setProductions] = useState<Production[]>([]);
  const [filteredProductions, setFilteredProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  
  useEffect(() => {
    fetchProductions();
  }, [userProfile, statusFilter, sortBy]);
  
  useEffect(() => {
    // Apply search filter whenever search query changes
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = productions.filter(prod => 
        prod.name.toLowerCase().includes(query) || 
        prod.venue.toLowerCase().includes(query)
      );
      setFilteredProductions(filtered);
    } else {
      setFilteredProductions(productions);
    }
  }, [searchQuery, productions]);
  
  const fetchProductions = async () => {
    if (!userProfile) return;
    
    setLoading(true);
    try {
      // Base query
      let productionsQuery = query(
        collection(firestore, 'productions'),
        orderBy(sortBy === 'date' ? 'date' : 'name', sortBy === 'date' ? 'desc' : 'asc')
      );
      
      // Add status filter if not 'all'
      if (statusFilter !== 'all') {
        productionsQuery = query(
          collection(firestore, 'productions'),
          where('status', '==', statusFilter),
          orderBy(sortBy === 'date' ? 'date' : 'name', sortBy === 'date' ? 'desc' : 'asc')
        );
      }
      
      // Add filter for 'today' special filter
      if (statusFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        productionsQuery = query(
          collection(firestore, 'productions'),
          where('date', '>=', Timestamp.fromDate(today)),
          where('date', '<', Timestamp.fromDate(tomorrow)),
          orderBy('date'),
          orderBy('startTime')
        );
      }
      
      const snapshot = await getDocs(productionsQuery);
      
      const productionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime.toDate(),
        callTime: doc.data().callTime.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Production));
      
      setProductions(productionsData);
      setFilteredProductions(productionsData);
    } catch (error) {
      console.error('Error fetching productions:', error);
      Alert.alert('Error', 'Failed to load productions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchProductions();
  };
  
  const handleProductionPress = (production: Production) => {
    navigation.navigate('ProductionDetails', { productionId: production.id });
  };
  
  const renderProductionItem = ({ item }: { item: Production }) => (
    <ProductionCard
      production={item}
      onPress={() => handleProductionPress(item)}
    />
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search productions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
        
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Status:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
                style={styles.picker}
              >
                <Picker.Item label="All" value="all" />
                <Picker.Item label="Requested" value="requested" />
                <Picker.Item label="Confirmed" value="confirmed" />
                <Picker.Item label="Completed" value="completed" />
                <Picker.Item label="Cancelled" value="cancelled" />
                <Picker.Item label="Overtime" value="overtime" />
                <Picker.Item label="Today" value="today" />
              </Picker>
            </View>
          </View>
          
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Sort By:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={sortBy}
                onValueChange={(value) => setSortBy(value as 'date' | 'name')}
                style={styles.picker}
              >
                <Picker.Item label="Date" value="date" />
                <Picker.Item label="Name" value="name" />
              </Picker>
            </View>
          </View>
        </View>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading productions...</Text>
        </View>
      ) : filteredProductions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="event-busy" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No productions found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProductions}
          renderItem={renderProductionItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onPress={handleRefresh} />
          }
        />
      )}
      
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('NewProductionRequest')}
      >
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007bff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  filtersContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  filterLabel: {
    fontSize: 14,
    marginBottom: 4,
    color: '#555',
  },
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 40,
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
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
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
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
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
  }
});

export default ProductionListScreen;