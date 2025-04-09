import React from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ProductionStatus, IssueStatus, IssuePriority } from '../../types';

interface StatusBadgeProps {
  status: ProductionStatus | IssueStatus | IssuePriority;
  type?: 'production' | 'issue' | 'priority';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'production',
  style,
  textStyle
}) => {
  const getBackgroundColor = () => {
    if (type === 'production') {
      switch (status) {
        case 'requested': return '#FFC107'; // Yellow
        case 'confirmed': return '#2196F3'; // Blue
        case 'completed': return '#4CAF50'; // Green
        case 'cancelled': return '#F44336'; // Red
        case 'overtime': return '#FF9800'; // Orange
        default: return '#9E9E9E'; // Grey
      }
    } else if (type === 'issue') {
      switch (status) {
        case 'pending': return '#FFC107'; // Yellow
        case 'in-progress': return '#2196F3'; // Blue
        case 'resolved': return '#4CAF50'; // Green
        default: return '#9E9E9E'; // Grey
      }
    } else if (type === 'priority') {
      switch (status) {
        case 'low': return '#4CAF50'; // Green
        case 'medium': return '#FFC107'; // Yellow
        case 'high': return '#F44336'; // Red
        default: return '#9E9E9E'; // Grey
      }
    }
    
    return '#9E9E9E'; // Grey default
  };

  const formatText = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Text
      style={[
        styles.badge,
        { backgroundColor: getBackgroundColor() },
        style,
        styles.text,
        textStyle
      ]}
    >
      {formatText(status)}
    </Text>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  }
});

export default StatusBadge;