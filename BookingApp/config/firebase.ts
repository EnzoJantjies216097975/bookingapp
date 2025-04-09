import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getFunctions, Functions } from 'firebase/functions';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';


let analytics: any = null;


const firebaseConfig = {
  apiKey: "AIzaSyCOcFalnN75Ta7FbM9yYDOSPQRXeTK4vxo",
  authDomain: "bookingapp-429d2.firebaseapp.com",
  projectId: "bookingapp-429d2",
  storageBucket: "bookingapp-429d2.firebasestorage.app",
  messagingSenderId: "853797141233",
  appId: "1:853797141233:web:cf9715f6b7b6a622e18750",
  measurementId: "G-1V32L44QX1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth: Auth = getAuth(app);
export const firestore: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const functions: Functions = getFunctions(app);

// Conditionally initialize Analytics (only in browser)
if (typeof window !== 'undefined') {
  import('firebase/analytics').then(({ getAnalytics }) => {
    analytics = getAnalytics(app);
  });
}

// Conditionally initialize Messaging (only in browser and supported env)
let messaging: Messaging | null = null;

const initializeMessaging = async () => {
  if (typeof window !== 'undefined' && (await isSupported())) {
    const { getMessaging } = await import('firebase/messaging');
    messaging = getMessaging(app);
  }
};

initializeMessaging();

export { messaging };
export default app;