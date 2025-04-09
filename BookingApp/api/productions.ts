import { firestore } from '../config/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy, Timestamp, serverTimestamp } from 'firebase/firestore';
import { functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { Production, ProductionStatus, Venue } from '../types';

// Convert Firestore data to Production object
const convertFirestoreProduction = (doc: any): Production => ({
  id: doc.id,
  ...doc.data(),
  date: doc.data().date.toDate(),
  startTime: doc.data().startTime.toDate(),
  endTime: doc.data().endTime.toDate(),
  callTime: doc.data().callTime.toDate(),
  createdAt: doc.data().createdAt?.toDate() || new Date(),
  actualEndTime: doc.data().actualEndTime?.toDate() || undefined
});

// Get all productions
export const getAllProductions = async (): Promise<Production[]> => {
  const productionsRef = collection(firestore, 'productions');
  const snapshot = await getDocs(productionsRef);
  
  return snapshot.docs.map(doc => convertFirestoreProduction(doc));
};

// Get a single production by ID
export const getProductionById = async (id: string): Promise<Production | null> => {
  const docRef = doc(firestore, 'productions', id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return convertFirestoreProduction(docSnap);
  }
  
  return null;
};

// Get productions by date range
export const getProductionsByDateRange = async (startDate: Date, endDate: Date): Promise<Production[]> => {
  const productionsRef = collection(firestore, 'productions');
  const q = query(
    productionsRef,
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate)),
    orderBy('date'),
    orderBy('startTime')
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => convertFirestoreProduction(doc));
};

// Get productions by status
export const getProductionsByStatus = async (status: ProductionStatus): Promise<Production[]> => {
  const productionsRef = collection(firestore, 'productions');
  const q = query(
    productionsRef,
    where('status', '==', status),
    orderBy('date')
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => convertFirestoreProduction(doc));
};

// Create a new production request
export interface ProductionCreateData {
  name: string;
  date: Date;
  venue: Venue;
  locationDetails?: string;
  startTime: Date;
  endTime: Date;
  callTime: Date;
  isOutsideBroadcast: boolean;
  notes?: string;
  requestedById: string;
  transportDetails?: string;
}

export const createProductionRequest = async (data: ProductionCreateData): Promise<string> => {
  // Convert date objects to Timestamps
  const firestoreData = {
    ...data,
    date: Timestamp.fromDate(data.date),
    startTime: Timestamp.fromDate(data.startTime),
    endTime: Timestamp.fromDate(data.endTime),
    callTime: Timestamp.fromDate(data.callTime),
    status: 'requested' as ProductionStatus,
    createdAt: serverTimestamp(),
    assignedStaff: {
      cameraOperators: [],
      soundOperators: [],
      lightingOperators: [],
      evsOperator: null,
      director: null,
      streamOperator: null,
      technician: null,
      electrician: null
    },
    overtimeReported: false
  };
  
  const productionsRef = collection(firestore, 'productions');
  const docRef = await addDoc(productionsRef, firestoreData);
  
  return docRef.id;
};

// Update production staff assignments
export interface StaffAssignmentData {
  productionId: string;
  assignedStaff: {
    cameraOperators: string[];
    soundOperators: string[];
    lightingOperators: string[];
    evsOperator?: string;
    director?: string;
    streamOperator?: string;
    technician?: string;
    electrician?: string;
  };
  processedById: string;
}

export const updateProductionStaffing = async (data: StaffAssignmentData): Promise<void> => {
  const productionRef = doc(firestore, 'productions', data.productionId);
  
  await updateDoc(productionRef, {
    assignedStaff: data.assignedStaff,
    processedById: data.processedById,
    status: 'confirmed' as ProductionStatus,
    updatedAt: serverTimestamp()
  });
  
  // After updating the production, trigger the function to send notifications
  const sendAssignmentNotification = httpsCallable(functions, 'sendAssignmentNotification');
  await sendAssignmentNotification({ productionId: data.productionId });
};

// Report production overtime
export interface OvertimeReportData {
  productionId: string;
  overtimeReason: string;
  actualEndTime: Date;
}

export const reportProductionOvertime = async (data: OvertimeReportData): Promise<void> => {
  const productionRef = doc(firestore, 'productions', data.productionId);
  
  await updateDoc(productionRef, {
    overtimeReported: true,
    overtimeReason: data.overtimeReason,
    actualEndTime: Timestamp.fromDate(data.actualEndTime),
    status: 'overtime' as ProductionStatus,
    updatedAt: serverTimestamp()
  });
};

// Cancel a production
export const cancelProduction = async (productionId: string, reason: string): Promise<void> => {
  const productionRef = doc(firestore, 'productions', productionId);
  
  await updateDoc(productionRef, {
    status: 'cancelled' as ProductionStatus,
    completionNotes: reason,
    updatedAt: serverTimestamp()
  });
};

// Mark a production as completed
export const completeProduction = async (productionId: string, notes?: string): Promise<void> => {
  const productionRef = doc(firestore, 'productions', productionId);
  
  await updateDoc(productionRef, {
    status: 'completed' as ProductionStatus,
    completionNotes: notes || '',
    updatedAt: serverTimestamp()
  });
};

// Check staff availability
export const checkStaffAvailability = async (
  staffId: string, 
  productionDate: Date, 
  startTime: Date, 
  endTime: Date, 
  currentProductionId?: string
): Promise<{ available: boolean; conflicts: any[] }> => {
  const checkAvailability = httpsCallable(functions, 'checkStaffAvailability');
  
  const result = await checkAvailability({
    staffId,
    productionDate: productionDate.toISOString(),
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    currentProductionId
  });
  
  return result.data as { available: boolean; conflicts: any[] };
};