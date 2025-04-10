import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';
import { format, isPast, isToday, differenceInMinutes, addHours } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Production } from '../types';

interface ProductionReminderProps {
  production: Production;
  onPress: (production: Production) => void;
  onRemind?: () => void;
}

const ProductionReminder: React.FC<ProductionReminderProps> = ({
  production,
  onPress,
  onRemind
}) => {
  const [timeLabel, setTimeLabel] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState<boolean>(false);

  useEffect(() => {
    if (!production) return;
    
    const updateTimeLabel = () => {
      const now = new Date();
      const productionDate = new Date(production.date);
      
      // Set hours and minutes from callTime
      productionDate.setHours(production.callTime.getHours());
      productionDate.setMinutes(production.callTime.getMinutes());
      
      if (isPast(productionDate) && !isToday(productionDate)) {
        // Past production
        setTimeLabel('Production has ended');
        setIsUrgent(false);
      } else if (isPast(productionDate) && isToday(productionDate)) {
        // Today but call time has passed
        setTimeLabel('Production in progress');
        setIsUrgent(true);
      } else if (isToday(productionDate)) {
        // Today but call time hasn't passed yet
        const minutesUntil = differenceInMinutes(productionDate, now);
        
        if (minutesUntil <= 60) {
          // Less than 1 hour
          setTimeLabel(`Call time in ${minutesUntil} minutes!`);
          setIsUrgent(true);
        } else {
          // More than 1 hour
          const hoursUntil = Math.floor(minutesUntil / 60);
          const remainingMinutes = minutesUntil % 60;
          setTimeLabel(`Call time in ${hoursUntil}h ${remainingMinutes}m`);
          setIsUrgent(false);
        }
      } else {
        // Future date
        setTimeLabel(`Call time: ${format(production.callTime, 'h:mm a')}`);
        setIsUrgent(false);
      }
    };
    
    updateTimeLabel();
    
    // Update every minute
    const intervalId = setInterval(updateTimeLabel, 60000);
    
    return () => clearInterval(intervalId);
  }, [production]);

  if (!production) return null;

  const handleRemindPress = () => {
    if (onRemind) {
      onRemind();
    } else {
      Alert.alert(
        'Production Reminder',
        'A reminder has been set for this production.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, isUrgent && styles.urgentContainer]}
      onPress={() => onPress(production)}
      activeOpacity={0.7}
    >
      <View style={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <Icon 
            name={isUrgent ? 'notifications-active' : 'notifications'} 
            size={24} 
            color={isUrgent ? '#FF9800' : '#007bff'} 
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{production.name}</Text>
          <Text style={styles.date}>{format(production.date, 'EEE, MMM d')}</Text>
          <Text style={[styles.time, isUrgent && styles.urgentTime]}>{timeLabel}</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.reminderButton}
        onPress={handleRemindPress}
      >
        <Icon name="alarm-add" size={20} color="#007bff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  urgentContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    backgroundColor: '#f1f9ff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  time: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
  urgentTime: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  reminderButton: {
    padding: 8,
  }
});

export default ProductionReminder;