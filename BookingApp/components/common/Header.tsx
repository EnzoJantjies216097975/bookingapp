import React, { ReactNode } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar, 
  Platform 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface HeaderProps {
  title: string;
  leftIcon?: string;
  rightIcon?: string;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  subtitle?: string;
  transparent?: boolean;
  rightComponent?: ReactNode;
}

const Header: React.FC<HeaderProps> = ({
  title,
  leftIcon = 'arrow-back',
  rightIcon,
  onLeftPress,
  onRightPress,
  subtitle,
  transparent = false,
  rightComponent
}) => {
  return (
    <View style={[
      styles.container,
      transparent && styles.transparentContainer
    ]}>
      <StatusBar 
        barStyle={transparent ? 'light-content' : 'dark-content'} 
        backgroundColor="transparent" 
        translucent={transparent}
      />
      
      <View style={styles.content}>
        {onLeftPress && (
          <TouchableOpacity 
            style={styles.leftButton} 
            onPress={onLeftPress}
          >
            <Icon 
              name={leftIcon} 
              size={24} 
              color={transparent ? 'white' : '#333'} 
            />
          </TouchableOpacity>
        )}
        
        <View style={styles.titleContainer}>
          <Text 
            style={[
              styles.title,
              transparent && styles.transparentTitle
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text 
              style={[
                styles.subtitle,
                transparent && styles.transparentSubtitle
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
        
        {(rightIcon || rightComponent) && (
          <View style={styles.rightContainer}>
            {rightComponent}
            {rightIcon && (
              <TouchableOpacity 
                style={styles.rightButton} 
                onPress={onRightPress}
              >
                <Icon 
                  name={rightIcon} 
                  size={24} 
                  color={transparent ? 'white' : '#333'} 
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 10,
  },
  transparentContainer: {
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
  },
  leftButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  transparentTitle: {
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  transparentSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  }
});

export default Header;