import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { CONSTANTS } from '../config/constants';

interface AppContextType {
  appVersion: string;
  isOnline: boolean;
  lastActive: Date | null;
  setIsOnline: (status: boolean) => void;
  appSettings: Record<string, any>;
  updateAppSettings: (key: string, value: any) => Promise<void>;
}

const defaultAppContext: AppContextType = {
  appVersion: CONSTANTS.APP_VERSION,
  isOnline: true,
  lastActive: null,
  setIsOnline: () => {},
  appSettings: {},
  updateAppSettings: async () => {},
};

export const AppContext = createContext<AppContextType>(defaultAppContext);

export const useAppContext = () => useContext(AppContext);

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [lastActive, setLastActive] = useState<Date | null>(new Date());
  const [appSettings, setAppSettings] = useState<Record<string, any>>({});

  // Load app settings from AsyncStorage
  useEffect(() => {
    const loadAppSettings = async () => {
      try {
        const settings = await AsyncStorage.getItem(CONSTANTS.APP_SETTINGS_KEY);
        if (settings) {
          setAppSettings(JSON.parse(settings));
        }
      } catch (error) {
        console.error('Error loading app settings:', error);
      }
    };

    loadAppSettings();
  }, []);

  // Track app active state
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        setLastActive(new Date());
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  // Update app settings
  const updateAppSettings = async (key: string, value: any) => {
    try {
      const updatedSettings = {
        ...appSettings,
        [key]: value,
      };
      
      await AsyncStorage.setItem(
        CONSTANTS.APP_SETTINGS_KEY,
        JSON.stringify(updatedSettings)
      );
      
      setAppSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating app settings:', error);
      throw error;
    }
  };

  const value: AppContextType = {
    appVersion: CONSTANTS.APP_VERSION,
    isOnline,
    lastActive,
    setIsOnline,
    appSettings,
    updateAppSettings,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};