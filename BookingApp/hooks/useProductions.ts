import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs, Timestamp, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { Production, ProductionStatus, UserRole } from '../types';

interface UseProductionsProps {
  userId?: string;
  userRole?: UserRole;
  status?: ProductionStatus | 'all' | 'today';
  limit?: number;
  live?: boolean; // Whether to use live updates with onSnapshot
}

export const useProductions = ({
  userId,
  userRole,
  status = 'all',
  limit,
  live = false
}: UseProductionsProps) => {
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProductions = useCallback(async () => {
    if (!userId) {
      setProductions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build query based on user role and status
      let productionsQuery;
      
      // Base collection reference
      const productionsRef = collection(firestore, 'productions');
      
      // Special case for 'today'
      if (status === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        productionsQuery = query(
          productionsRef,
          where('date', '>=', Timestamp.fromDate(today)),
          where('date', '<', Timestamp.fromDate(tomorrow)),
          orderBy('date'),
          orderBy('startTime')
        );
      } else if (userRole === 'producer') {
        // Producers see their own productions
        productionsQuery = status === 'all'
          ? query(
              productionsRef,
              where('requestedById', '==', userId),
              orderBy('date', 'desc')
            )
          : query(
              productionsRef,
              where('requestedById', '==', userId),
              where('status', '==', status),
              orderBy('date', 'desc')
            );
      } else if (userRole === 'booking_officer') {
        // Booking officers see all productions
        productionsQuery = status === 'all'
          ? query(
              productionsRef,
              orderBy('date', 'desc')
            )
          : query(
              productionsRef,
              where('status', '==', status),
              orderBy('date', 'desc')
            );
      } else {
        // Operators see productions they're assigned to
        const staffFieldMap: Record<string, string> = {
          'camera_operator': 'assignedStaff.cameraOperators',
          'sound_operator': 'assignedStaff.soundOperators',
          'lighting_operator': 'assignedStaff.lightingOperators',
          'evs_operator': 'assignedStaff.evsOperator',
          'director': 'assignedStaff.director',
          'stream_operator': 'assignedStaff.streamOperator',
          'technician': 'assignedStaff.technician',
          'electrician': 'assignedStaff.electrician'
        };
        
        const field = userRole ? staffFieldMap[userRole] : null;
        
        if (field) {
          if (field.endsWith('s')) {
            // Array fields (operators with multiple staff)
            productionsQuery = status === 'all'
              ? query(
                  productionsRef,
                  where(field, 'array-contains', userId),
                  orderBy('date', 'desc')
                )
              : query(
                  productionsRef,
                  where(field, 'array-contains', userId),
                  where('status', '==', status),
                  orderBy('date', 'desc')
                );
          } else {
            // Single value fields
            productionsQuery = status === 'all'
              ? query(
                  productionsRef,
                  where(field, '==', userId),
                  orderBy('date', 'desc')
                )
              : query(
                  productionsRef,
                  where(field, '==', userId),
                  where('status', '==', status),
                  orderBy('date', 'desc')
                );
          }
        } else {
          // Default query if role not recognized
          productionsQuery = query(
            productionsRef,
            orderBy('date', 'desc')
          );
        }
      }
      
      // Apply limit if specified
      if (limit) {
        productionsQuery = query(productionsQuery, limit);
      }
      
      if (live) {
        // Set up real-time listener
        return onSnapshot(productionsQuery, (snapshot) => {
          const productionData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date.toDate(),
            startTime: doc.data().startTime.toDate(),
            endTime: doc.data().endTime.toDate(),
            callTime: doc.data().callTime.toDate(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            actualEndTime: doc.data().actualEndTime?.toDate()
          } as Production));
          
          setProductions(productionData);
          setLoading(false);
        }, (err) => {
          console.error('Error in production snapshot:', err);
          setError(err);
          setLoading(false);
        });
      } else {
        // One-time fetch
        const snapshot = await getDocs(productionsQuery);
        
        const productionData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate(),
          startTime: doc.data().startTime.toDate(),
          endTime: doc.data().endTime.toDate(),
          callTime: doc.data().callTime.toDate(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          actualEndTime: doc.data().actualEndTime?.toDate()
        } as Production));
        
        setProductions(productionData);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching productions:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch productions'));
      setLoading(false);
    }
  }, [userId, userRole, status, limit, live]);

  useEffect(() => {
    const unsubscribe = fetchProductions();
    
    // Clean up the listener if it's a live query
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [fetchProductions]);

  return {
    productions,
    loading,
    error,
    refreshProductions: fetchProductions
  };
};