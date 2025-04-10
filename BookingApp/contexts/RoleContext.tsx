import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole } from '../types';

interface RoleContextType {
  activeRole: UserRole | null;
  setActiveRole: (role: UserRole) => void;
  clearActiveRole: () => void;
  isBookingOfficer: boolean;
  isProducer: boolean;
  isOperator: boolean;
}

export const RoleContext = createContext<RoleContextType>({
  activeRole: null,
  setActiveRole: () => {},
  clearActiveRole: () => {},
  isBookingOfficer: false,
  isProducer: false,
  isOperator: false
});

interface RoleProviderProps {
  children: ReactNode;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const [activeRole, setActiveRoleState] = useState<UserRole | null>(null);
  
  // Load saved role from AsyncStorage on component mount
  useEffect(() => {
    const loadRole = async () => {
      try {
        const savedRole = await AsyncStorage.getItem('activeRole');
        if (savedRole) {
          setActiveRoleState(savedRole as UserRole);
        }
      } catch (error) {
        console.error('Error loading active role from storage:', error);
      }
    };
    
    loadRole();
  }, []);
  
  // Set active role and save to AsyncStorage
  const setActiveRole = async (role: UserRole) => {
    try {
      await AsyncStorage.setItem('activeRole', role);
      setActiveRoleState(role);
    } catch (error) {
      console.error('Error saving active role to storage:', error);
    }
  };
  
  // Clear active role from state and AsyncStorage
  const clearActiveRole = async () => {
    try {
      await AsyncStorage.removeItem('activeRole');
      setActiveRoleState(null);
    } catch (error) {
      console.error('Error clearing active role from storage:', error);
    }
  };
  
  // Role type checks for convenience
  const isBookingOfficer = activeRole === 'booking_officer';
  const isProducer = activeRole === 'producer';
  const isOperator = activeRole !== null && 
                    !isBookingOfficer && 
                    !isProducer;
  
  const value = {
    activeRole,
    setActiveRole,
    clearActiveRole,
    isBookingOfficer,
    isProducer,
    isOperator
  };
  
  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};