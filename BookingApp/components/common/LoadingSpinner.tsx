import React from 'react';
import { 
  View, 
  ActivityIndicator, 
  Text, 
  StyleSheet, 
  Modal,
  ViewStyle
} from 'react-native';

interface LoadingSpinnerProps {
  visible: boolean;
  text?: string;
  fullScreen?: boolean;
  spinnerSize?: 'small' | 'large';
  spinnerColor?: string;
  style?: ViewStyle;
  textStyle?: ViewStyle;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  visible,
  text,
  fullScreen = false,
  spinnerSize = 'large',
  spinnerColor = '#007bff',
  style,
  textStyle
}) => {
  if (!visible) return null;

  const renderContent = () => (
    <View style={[
      styles.container, 
      fullScreen && styles.fullScreenContainer,
      style
    ]}>
      <ActivityIndicator size={spinnerSize} color={spinnerColor} />
      {text && <Text style={[styles.text, textStyle]}>{text}</Text>}
    </View>
  );

  if (fullScreen) {
    return (
      <Modal
        transparent
        visible={visible}
        animationType="fade"
      >
        <View style={styles.modalBackground}>
          {renderContent()}
        </View>
      </Modal>
    );
  }

  return renderContent();
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fullScreenContainer: {
    padding: 30,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  }
});

export default LoadingSpinner;