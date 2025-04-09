import { firestore } from '../config/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Issue, IssueStatus, IssuePriority } from '../types';

// Convert Firestore data to Issue object
const convertFirestoreIssue = (doc: any): Issue => ({
  id: doc.id,
  ...doc.data(),
  createdAt: doc.data().createdAt?.toDate() || new Date(),
  resolvedAt: doc.data().resolvedAt?.toDate() || undefined
});

// Get all issues
export const getAllIssues = async (): Promise<Issue[]> => {
  const issuesRef = collection(firestore, 'issues');
  const q = query(issuesRef, orderBy('createdAt', 'desc'));
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => convertFirestoreIssue(doc));
};

// Get issue by ID
export const getIssueById = async (issueId: string): Promise<Issue | null> => {
  const docRef = doc(firestore, 'issues', issueId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return convertFirestoreIssue(docSnap);
  }
  
  return null;
};

// Get issues for a production
export const getIssuesByProduction = async (productionId: string): Promise<Issue[]> => {
  const issuesRef = collection(firestore, 'issues');
  const q = query(
    issuesRef,
    where('productionId', '==', productionId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => convertFirestoreIssue(doc));
};

// Get issues reported by a user
export const getIssuesByUser = async (userId: string): Promise<Issue[]> => {
  const issuesRef = collection(firestore, 'issues');
  const q = query(
    issuesRef,
    where('reportedById', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => convertFirestoreIssue(doc));
};

// Report a new issue
export interface CreateIssueData {
  reportedById: string;
  productionId: string;
  description: string;
  priority: IssuePriority;
}

export const createIssue = async (data: CreateIssueData): Promise<string> => {
  const issueData = {
    ...data,
    status: 'pending' as IssueStatus,
    createdAt: Timestamp.now()
  };
  
  const issuesRef = collection(firestore, 'issues');
  const docRef = await addDoc(issuesRef, issueData);
  
  return docRef.id;
};

// Update issue status
export const updateIssueStatus = async (
  issueId: string, 
  status: IssueStatus
): Promise<void> => {
  const issueRef = doc(firestore, 'issues', issueId);
  
  const updateData: Record<string, any> = { status };
  
  // If resolved, add timestamp
  if (status === 'resolved') {
    updateData.resolvedAt = Timestamp.now();
  }
  
  await updateDoc(issueRef, updateData);
};

// Update issue priority
export const updateIssuePriority = async (
  issueId: string, 
  priority: IssuePriority
): Promise<void> => {
  const issueRef = doc(firestore, 'issues', issueId);
  await updateDoc(issueRef, { priority });
};