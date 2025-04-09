import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Production } from '../../types';

interface ProductionCardProps {
  production: Production;
  onPress: () => void;
  rightComponent?: React.ReactNode;
}

const ProductionCard: React.FC<ProductionCardProps> = ({ 
  production, 
  onPress, 
  rightComponent 
}) => {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'requested': return '#FFC107'; // Yellow
      case 'confirmed': return '#2196F3'; // Blue
      case 'completed': return '#4CAF50'; // Green
      case 'cancelled': return '#F44336'; // Red
      case 'overtime': return '#FF9800'; // Orange
      default: return '#9E9E9E'; // Grey
    }
  };
  
  const getVenueIcon = (venue: string): string => {
    if (venue.startsWith('Studio')) {
      return 'videocam';
    } else {
      return 'location-on';
    }
  };
  
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>{production.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(production.status) }]}>
          <Text style={styles.statusText}>
            {production.status.charAt(0).toUpperCase() + production.status.slice(1)}
          </Text>
        </View>
      </View>
      
      <View style={styles.dateRow}>
        <Icon name="event" size={16} color="#666" />
        <Text style={styles.dateText}>{format(production.date, 'EEE, MMM d, yyyy')}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Icon name={getVenueIcon(production.venue)} size={16} color="#666" />
          <Text style={styles.infoText} numberOfLines={1}>{production.venue}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Icon name="schedule" size={16} color="#666" />
          <Text style={styles.infoText}>
            {format(production.startTime, 'h:mm a')} - {format(production.endTime, 'h:mm a')}
          </Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.callTimeContainer}>
          <Icon name="access-time" size={16} color="#007bff" />
          <Text style={styles.callTimeText}>
            Call time: {format(production.callTime, 'h:mm a')}
          </Text>
        </View>
        
        {rightComponent && (
          <View style={styles.rightComponentContainer}>
            {rightComponent}
          </View>
        )}
      </View>
      
      {production.isOutsideBroadcast && (
        <View style={styles.obBadge}>
          <Text style={styles.obText}>OB</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#555',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#555',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  callTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callTimeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007bff',
  },
  rightComponentContainer: {
    alignItems: 'flex-end',
  },
  obBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#673AB7',
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  obText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default ProductionCard;