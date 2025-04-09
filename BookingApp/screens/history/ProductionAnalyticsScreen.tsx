import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Platform
} from 'react-native';
import { firestore } from '../../config/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { Production, Venue } from '../../types';

const screenWidth = Dimensions.get('window').width - 40;

const ProductionAnalyticsScreen: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [productionsByMonth, setProductionsByMonth] = useState<Array<{ month: string; count: number }>>([]);
  const [venueDistribution, setVenueDistribution] = useState<Array<{ venue: string; count: number }>>([]);
  const [staffWorkload, setStaffWorkload] = useState<Array<{ name: string; count: number }>>([]);
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '12m'>('6m');
  
  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);
  
  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      let startDate: Date;
      
      if (timeRange === '3m') {
        startDate = subMonths(endDate, 3);
      } else if (timeRange === '6m') {
        startDate = subMonths(endDate, 6);
      } else {
        startDate = subMonths(endDate, 12);
      }
      
      // Fetch all productions in this date range
      const snapshot = await getDocs(query(
        collection(firestore, 'productions'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate))
      ));
      
      const productions: Production[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime.toDate(),
        callTime: doc.data().callTime.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Production));
      
      // Calculate productions by month
      const months = eachMonthOfInterval({ start: startDate, end: endDate });
      const productionCounts = months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        
        const count = productions.filter(
          prod => prod.date >= monthStart && prod.date <= monthEnd
        ).length;
        
        return {
          month: format(month, 'MMM yyyy'),
          count
        };
      });
      
      setProductionsByMonth(productionCounts);
      
      // Calculate venue distribution
      const venues: Record<Venue | string, number> = {};
      productions.forEach(prod => {
        venues[prod.venue] = (venues[prod.venue] || 0) + 1;
      });
      
      const venueData = Object.entries(venues)
        .map(([venue, count]) => ({ venue, count }))
        .sort((a, b) => b.count - a.count);
      
      setVenueDistribution(venueData);
      
      // Calculate staff workload
      // This would normally require more complex queries to get all staff assignments
      // Simplified version for the example:
      const staffAssignments: Record<string, { name: string; count: number }> = {};
      
      for (const production of productions) {
        // Count each staff type assignment
        const staffTypes = [
          'cameraOperators', 'soundOperators', 'lightingOperators',
          'evsOperator', 'director', 'streamOperator', 'technician', 'electrician'
        ];
        
        for (const staffType of staffTypes) {
          if (staffType.endsWith('s')) {
            // It's an array of staff
            if (production.assignedStaff[staffType]?.length > 0) {
              for (const staffId of production.assignedStaff[staffType]) {
                // In a real implementation, you would fetch the staff names from Firestore
                // For simplicity, we'll use placeholder names
                const staffName = `Staff ${staffId.substr(0, 4)}`;
                if (!staffAssignments[staffId]) {
                  staffAssignments[staffId] = { name: staffName, count: 0 };
                }
                staffAssignments[staffId].count += 1;
              }
            }
          } else {
            // It's a single assignment
            if (production.assignedStaff[staffType]) {
              const staffId = production.assignedStaff[staffType];
              const staffName = `Staff ${staffId.substr(0, 4)}`;
              if (!staffAssignments[staffId]) {
                staffAssignments[staffId] = { name: staffName, count: 0 };
              }
              staffAssignments[staffId].count += 1;
            }
          }
        }
      }
      
      // Get top 10 staff by workload
      const staffData = Object.values(staffAssignments)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      setStaffWorkload(staffData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Prepare chart data
  const lineChartData = {
    labels: productionsByMonth.map(item => item.month),
    datasets: [
      {
        data: productionsByMonth.map(item => item.count),
        color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ['Productions by Month']
  };
  
  const barChartData = {
    labels: venueDistribution.map(item => item.venue),
    datasets: [
      {
        data: venueDistribution.map(item => item.count)
      }
    ]
  };
  
  const staffBarChartData = {
    labels: staffWorkload.map(item => item.name.split(' ')[1]), // Just using the ID part for labels
    datasets: [
      {
        data: staffWorkload.map(item => item.count)
      }
    ]
  };
  
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#007bff'
    }
  };
  
  const venueChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => `rgba(0, 191, 165, ${opacity})`
  };
  
  const staffChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => `rgba(255, 99, 71, ${opacity})`
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Production Analytics</Text>
      
      <View style={styles.timeFilterContainer}>
        <Text style={styles.filterLabel}>Time Range:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={timeRange}
            onValueChange={(value) => setTimeRange(value as '3m' | '6m' | '12m')}
            style={styles.picker}
          >
            <Picker.Item label="Last 3 Months" value="3m" />
            <Picker.Item label="Last 6 Months" value="6m" />
            <Picker.Item label="Last 12 Months" value="12m" />
          </Picker>
        </View>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
      ) : (
        <>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Productions by Month</Text>
            {productionsByMonth.length > 0 ? (
              <LineChart
                data={lineChartData}
                width={screenWidth}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Icon name="bar-chart" size={48} color="#ddd" />
                <Text style={styles.noDataText}>No production data for this period</Text>
              </View>
            )}
          </View>
          
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Productions by Venue</Text>
            {venueDistribution.length > 0 ? (
              <BarChart
                data={barChartData}
                width={screenWidth}
                height={220}
                chartConfig={venueChartConfig}
                style={styles.chart}
                verticalLabelRotation={30}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Icon name="pie-chart" size={48} color="#ddd" />
                <Text style={styles.noDataText}>No venue data for this period</Text>
              </View>
            )}
          </View>
          
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Top Staff by Assignments</Text>
            {staffWorkload.length > 0 ? (
              <BarChart
                data={staffBarChartData}
                width={screenWidth}
                height={220}
                chartConfig={staffChartConfig}
                style={styles.chart}
                verticalLabelRotation={30}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Icon name="people" size={48} color="#ddd" />
                <Text style={styles.noDataText}>No staff assignment data for this period</Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchAnalyticsData}
          >
            <Icon name="refresh" size={20} color="white" />
            <Text style={styles.refreshButtonText}>Refresh Data</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  timeFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
  },
  pickerContainer: {
    flex: 1,
    height: 40,
    ...Platform.select({
      android: {},
      ios: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        overflow: 'hidden',
      }
    })
  },
  picker: {
    flex: 1,
  },
  loader: {
    marginTop: 100,
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  refreshButton: {
    backgroundColor: '#007bff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 40,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ProductionAnalyticsScreen;