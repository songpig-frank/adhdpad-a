import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_APP_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_APP_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_FIREBASE_APP_ID
};

if (!firebaseConfig.apiKey) {
  console.error("Firebase configuration is missing. Please check your environment variables in Secrets.");
}

let db;
let storage;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  console.log("Firebase connection successful!");
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

const testConnection = async () => {
  try {
    const testCollection = collection(db, 'test');
    await addDoc(testCollection, {
      test: true,
      timestamp: new Date()
    });
    console.log("Successfully wrote to Firestore!");
  } catch (error) {
    console.error("Error writing to Firestore:", error);
  }
};

testConnection();

export { db, storage };
