import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Platform
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  label?: string;
  placeholder?: string;
  format?: string;
  minDate?: Date;
  maxDate?: Date;
  error?: string;
  disabled?: boolean;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  mode = 'date',
  label,
  placeholder = 'Select',
  format: dateFormat,
  minDate,
  maxDate,
  error,
  disabled = false
}) => {
  const [visible, setVisible] = useState(false);

  const formatValue = () => {
    if (!value) return placeholder;
    
    if (dateFormat) {
      return format(value, dateFormat);
    }
    
    switch (mode) {
      case 'date':
        return format(value, 'MMMM d, yyyy');
      case 'time':
        return format(value, 'h:mm a');
      case 'datetime':
        return format(value, 'MMMM d, yyyy h:mm a');
      default:
        return format(value, 'MMMM d, yyyy');
    }
  };

  const getIconName = () => {
    switch (mode) {
      case 'date':
        return 'calendar-today';
      case 'time':
        return 'access-time';
      case 'datetime':
        return 'event';
      default:
        return 'calendar-today';
    }
  };

  const handleConfirm = (date: Date) => {
    setVisible(false);
    onChange(date);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          styles.input,
          error && styles.inputError,
          disabled && styles.inputDisabled
        ]}
        onPress={() => !disabled && setVisible(true)}
        disabled={disabled}
      >
        <Text 
          style={[
            styles.value,
            !value && styles.placeholder,
            disabled && styles.valueDisabled
          ]}
        >
          {formatValue()}
        </Text>
        <Icon name={getIconName()} size={20} color={disabled ? '#aaa' : '#007bff'} />
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <DateTimePickerModal
        isVisible={visible}
        mode={mode}
        date={value || new Date()}
        onConfirm={handleConfirm}
        onCancel={() => setVisible(false)}
        minimumDate={minDate}
        maximumDate={maxDate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  placeholder: {
    color: '#999',
  },
  valueDisabled: {
    color: '#999',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 4,
  }
});

export default DateTimePicker;