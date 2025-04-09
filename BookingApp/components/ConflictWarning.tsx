import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { format } from 'date-fns';
import { Production } from '../types';

interface ConflictWarningProps {
  visible: boolean;
  conflicts: Production[];
  onClose: () => void;
  onContinueAnyway: () => void;
}

const ConflictWarning: React.FC<ConflictWarningProps> = ({
  visible,
  conflicts,
  onClose,
  onContinueAnyway
}) => {
  if (!conflicts || conflicts.length === 0) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.warningHeader}>
            <Icon name="warning" size={28} color="#FFC107" />
            <Text style={styles.warningTitle}>Scheduling Conflict</Text>
          </View>
          
          <Text style={styles.warningDescription}>
            The selected staff member(s) already have production assignments that conflict with this time slot:
          </Text>
          
          <View style={styles.conflictList}>
            {conflicts.map((conflict, index) => (
              <View key={index} style={styles.conflictItem}>
                <Text style={styles.conflictName}>{conflict.name}</Text>
                <Text style={styles.conflictDetail}>
                  {format(conflict.date, 'MMM d, yyyy')}
                </Text>
                <Text style={styles.conflictDetail}>
                  {format(conflict.startTime, 'h:mm a')} - {format(conflict.endTime, 'h:mm a')}
                </Text>
              </View>
            ))}
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.continueButton]}
              onPress={onContinueAnyway}
            >
              <Text style={styles.continueButtonText}>Continue Anyway</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxWidth: 450,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#333'
  },
  warningDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 16,
    lineHeight: 22
  },
  conflictList: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20
  },
  conflictItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  conflictName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  conflictDetail: {
    fontSize: 14,
    color: '#666'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 5,
    minWidth: 120,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#f1f1f1',
    marginRight: 8
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: 'bold'
  },
  continueButton: {
    backgroundColor: '#dc3545',
    marginLeft: 8
  },
  continueButtonText: {
    color: 'white',
    fontWeight: 'bold'
  }
});

export default ConflictWarning;