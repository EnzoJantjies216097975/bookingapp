import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  type?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  type = 'primary',
  size = 'medium',
  loading = false,
  icon,
  style,
  textStyle,
  ...rest
}) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'primary': return '#007bff';
      case 'secondary': return '#6c757d';
      case 'danger': return '#dc3545';
      case 'success': return '#28a745';
      default: return '#007bff';
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small': return { paddingVertical: 6, paddingHorizontal: 12 };
      case 'medium': return { paddingVertical: 10, paddingHorizontal: 16 };
      case 'large': return { paddingVertical: 14, paddingHorizontal: 20 };
      default: return { paddingVertical: 10, paddingHorizontal: 16 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return 14;
      case 'medium': return 16;
      case 'large': return 18;
      default: return 16;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        getButtonSize(),
        style
      ]}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          {icon}
          <Text 
            style={[
              styles.text, 
              { fontSize: getFontSize() },
              icon && styles.textWithIcon,
              textStyle
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  textWithIcon: {
    marginLeft: 8,
  }
});

export default Button;