import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getFunctions, Functions } from 'firebase/functions';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';
import { getAnalytics } from "firebase/analytics";


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
const analytics = getAnalytics(app);

// Export Firebase services
export const auth: Auth = getAuth(app);
export const firestore: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const functions: Functions = getFunctions(app);

let messagingInstance: any = null;
const initializeMessaging = async () => {
  try {
    if (await isSupported()) {
      messagingInstance = getMessaging(app);
    }
  } catch (error) {
    console.log('Firebase messaging is not supported in this environment');
  }
};

initializeMessaging();
export const messaging = messagingInstance;

export default app;

