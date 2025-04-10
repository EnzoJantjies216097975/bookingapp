import { useState, useEffect, useCallback } from 'react';
import { Appearance, ColorSchemeName, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  primary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

interface UseThemeReturn {
  theme: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setTheme: (mode: ThemeMode) => Promise<void>;
}

// Define our theme colors
const lightColors: ThemeColors = {
  primary: '#007bff',
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#333333',
  border: '#e0e0e0',
  notification: '#ff3b30',
  error: '#dc3545',
  success: '#28a745',
  warning: '#ffc107',
  info: '#17a2b8'
};

const darkColors: ThemeColors = {
  primary: '#0a84ff',
  background: '#1c1c1e',
  card: '#2c2c2e',
  text: '#ffffff',
  border: '#38383a',
  notification: '#ff453a',
  error: '#ff453a',
  success: '#32d74b',
  warning: '#ffd60a',
  info: '#64d2ff'
};

const THEME_STORAGE_KEY = 'app_theme_mode';

export const useTheme = (): UseThemeReturn => {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [systemTheme, setSystemTheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  // Load saved theme from AsyncStorage on first render
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
          setThemeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };
    
    loadTheme();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (Platform.OS !== 'web') {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        setSystemTheme(colorScheme);
      });
      
      return () => subscription.remove();
    }
  }, []);

  // Function to change theme
  const setTheme = useCallback(async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeState(mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }, []);

  // Determine if we should use dark theme
  const isDark = theme === 'system' 
    ? systemTheme === 'dark'
    : theme === 'dark';

  // Get the appropriate colors based on the theme
  const colors = isDark ? darkColors : lightColors;

  return {
    theme,
    isDark,
    colors,
    setTheme
  };
};