import React, { ReactNode } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle,
  TouchableOpacity
} from 'react-native';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  onPress?: () => void;
  elevation?: number;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  footer,
  style,
  titleStyle,
  subtitleStyle,
  onPress,
  elevation = 2
}) => {
  const CardContainer = onPress ? TouchableOpacity : View;

  return (
    <CardContainer 
      style={[
        styles.container, 
        { elevation }, 
        style
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
          {subtitle && <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>}
        </View>
      )}
      
      <View style={styles.content}>
        {children}
      </View>
      
      {footer && (
        <View style={styles.footer}>
          {footer}
        </View>
      )}
    </CardContainer>
  );
};

const styles = StyleSheet.create({
    container: {
      backgroundColor: 'white',
      borderRadius: 8,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      marginBottom: 12,
    },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
    },
    subtitle: {
      fontSize: 14,
      color: '#666',
      marginTop: 4,
    },
    content: {
      padding: 16,
    },
    footer: {
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: '#f0f0f0',
      backgroundColor: '#f9f9f9',
    }
  });
  
  export default Card;