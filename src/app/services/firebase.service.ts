import { Injectable } from '@angular/core';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, collection, getDocs, Firestore } from 'firebase/firestore';
import { getDatabase, ref, set, get, remove, Database } from 'firebase/database';
import { environment } from '../environments/environment';
import { AppNotification, Customer, Enquiry, EnquiryStatus, Payment } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private db: Firestore | null = null;
  private rtdb: Database | null = null;
  private isFirebaseInitialized = false;

  constructor() {
    this.initFirebase();
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private initFirebase(): void {
    if (!this.isBrowser()) return;

    try {
      if (!getApps().length) {
        this.app = initializeApp(environment.firebase);
      } else {
        this.app = getApp();
      }
      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);
      this.rtdb = getDatabase(this.app);
      this.isFirebaseInitialized = true;
    } catch (error) {
      console.warn('Firebase initialization notice:', error);
      this.isFirebaseInitialized = false;
    }
  }

  private formatFirebaseError(err: any): string {
    const rawMsg = (err?.message || err?.code || String(err)).toLowerCase();

    if (rawMsg.includes('configuration_not_found') || rawMsg.includes('auth/configuration-not-found')) {
      return 'Firebase Email/Password Sign-In is not enabled yet! Please open Firebase Console ➔ Authentication ➔ Sign-in method ➔ Enable Email/Password.';
    }
    if (rawMsg.includes('email-already-in-use') || rawMsg.includes('auth/email-already-in-use')) {
      return 'This email address is already registered in Firebase. Please click Sign In instead.';
    }
    if (
      rawMsg.includes('invalid_login_credentials') ||
      rawMsg.includes('invalid-credential') ||
      rawMsg.includes('wrong-password') ||
      rawMsg.includes('user-not-found') ||
      rawMsg.includes('invalid-email')
    ) {
      return 'Invalid email or password. If you do not have an account yet, please click "New Customer Register" tab to create one.';
    }
    return err?.message || err?.code || 'Firebase authentication failed.';
  }

  // --- Authentication Firebase API ---
  async login(email: string, pass: string): Promise<{ user: FirebaseUser | null; error?: string }> {
    if (!this.isBrowser() || !this.auth || !this.isFirebaseInitialized) {
      return { user: null, error: 'Firebase is not initialized' };
    }

    try {
      const cred = await signInWithEmailAndPassword(this.auth, email, pass);
      return { user: cred.user };
    } catch (err: any) {
      return { user: null, error: this.formatFirebaseError(err) };
    }
  }

  async register(email: string, pass: string): Promise<{ user: FirebaseUser | null; error?: string }> {
    if (!this.isBrowser() || !this.auth || !this.isFirebaseInitialized) {
      return { user: null, error: 'Firebase is not initialized' };
    }

    try {
      const cred = await createUserWithEmailAndPassword(this.auth, email, pass);
      return { user: cred.user };
    } catch (err: any) {
      return { user: null, error: this.formatFirebaseError(err) };
    }
  }

  // --- Customer & Payment Data Storage in Firebase ---
  async saveCustomer(customer: Customer): Promise<void> {
    if (!this.isBrowser() || !this.isFirebaseInitialized) return;

    // 1. Save to Firestore Database
    if (this.db) {
      try {
        const custDocRef = doc(this.db, 'customers', customer.id);
        await setDoc(custDocRef, { ...customer }, { merge: true });
      } catch (err) {
        console.warn('Firestore customer save notice:', err);
      }
    }

    // 2. Save to Realtime Database
    if (this.rtdb) {
      try {
        const custRtRef = ref(this.rtdb, `customers/${customer.id}`);
        await set(custRtRef, { ...customer });
      } catch (err) {
        console.warn('Realtime DB customer save notice:', err);
      }
    }
  }

  async savePayment(payment: Payment): Promise<void> {
    if (!this.isBrowser() || !this.isFirebaseInitialized) return;

    // 1. Save to Firestore Database
    if (this.db) {
      try {
        const payDocRef = doc(this.db, 'payments', payment.id);
        await setDoc(payDocRef, { ...payment }, { merge: true });
      } catch (err) {
        console.warn('Firestore payment save notice:', err);
      }
    }

    // 2. Save to Realtime Database
    if (this.rtdb) {
      try {
        const payRtRef = ref(this.rtdb, `payments/${payment.id}`);
        await set(payRtRef, { ...payment });
      } catch (err) {
        console.warn('Realtime DB payment save notice:', err);
      }
    }
  }

  async fetchCustomersFromFirebase(): Promise<Customer[]> {
    if (!this.isBrowser() || !this.isFirebaseInitialized) return [];

    const customersList: Customer[] = [];

    // Try fetching from Firestore first
    if (this.db) {
      try {
        const querySnapshot = await getDocs(collection(this.db, 'customers'));
        querySnapshot.forEach((docSnap: any) => {
          if (docSnap.exists()) {
            customersList.push(docSnap.data() as Customer);
          }
        });
        if (customersList.length > 0) return customersList;
      } catch (e) {
        console.warn('Firestore fetch notice:', e);
      }
    }

    // Fallback to Realtime Database if Firestore is empty
    if (this.rtdb) {
      try {
        const snapshot = await get(ref(this.rtdb, 'customers'));
        if (snapshot.exists()) {
          const val = snapshot.val();
          Object.keys(val).forEach(key => {
            customersList.push(val[key]);
          });
        }
      } catch (e) {
        console.warn('Realtime DB fetch notice:', e);
      }
    }

    return customersList;
  }

  async fetchPaymentsFromFirebase(): Promise<Payment[]> {
    if (!this.isBrowser() || !this.isFirebaseInitialized) return [];

    const paymentsList: Payment[] = [];

    if (this.db) {
      try {
        const querySnapshot = await getDocs(collection(this.db, 'payments'));
        querySnapshot.forEach((docSnap: any) => {
          if (docSnap.exists()) {
            paymentsList.push(docSnap.data() as Payment);
          }
        });
        if (paymentsList.length > 0) return paymentsList;
      } catch (e) {
        console.warn('Firestore payments fetch notice:', e);
      }
    }

    if (this.rtdb) {
      try {
        const snapshot = await get(ref(this.rtdb, 'payments'));
        if (snapshot.exists()) {
          const val = snapshot.val();
          Object.keys(val).forEach(key => {
            paymentsList.push(val[key]);
          });
        }
      } catch (e) {
        console.warn('Realtime DB payments fetch notice:', e);
      }
    }

    return paymentsList;
  }

  async deleteCustomerFromFirebase(customerId: string): Promise<void> {
    if (!this.isBrowser() || !this.isFirebaseInitialized) return;

    if (this.db) {
      try {
        await deleteDoc(doc(this.db, 'customers', customerId));
      } catch (e) {}
    }
    if (this.rtdb) {
      try {
        await remove(ref(this.rtdb, `customers/${customerId}`));
      } catch (e) {}
    }
  }

  async deletePaymentFromFirebase(paymentId: string): Promise<void> {
    if (!this.isBrowser() || !this.isFirebaseInitialized) return;

    if (this.db) {
      try {
        await deleteDoc(doc(this.db, 'payments', paymentId));
      } catch (e) {}
    }
    if (this.rtdb) {
      try {
        await remove(ref(this.rtdb, `payments/${paymentId}`));
      } catch (e) {}
    }
  }

  // --- Notifications Firebase API ---
  async saveNotification(notif: AppNotification): Promise<void> {
    if (!this.isBrowser() || !this.isFirebaseInitialized) return;

    if (this.db) {
      try {
        const notifDocRef = doc(this.db, 'notifications', notif.id);
        await setDoc(notifDocRef, { ...notif }, { merge: true });
      } catch (err) {
        console.warn('Firestore notification save notice:', err);
      }
    }

    if (this.rtdb) {
      try {
        const notifRtRef = ref(this.rtdb, `notifications/${notif.id}`);
        await set(notifRtRef, { ...notif });
      } catch (err) {
        console.warn('Realtime DB notification save notice:', err);
      }
    }
  }

  async fetchNotificationsFromFirebase(): Promise<AppNotification[]> {
    if (!this.isBrowser() || !this.isFirebaseInitialized) return [];

    const list: AppNotification[] = [];

    if (this.db) {
      try {
        const querySnapshot = await getDocs(collection(this.db, 'notifications'));
        querySnapshot.forEach((docSnap: any) => {
          if (docSnap.exists()) {
            list.push(docSnap.data() as AppNotification);
          }
        });
        if (list.length > 0) {
          return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
      } catch (e) {
        console.warn('Firestore notifications fetch notice:', e);
      }
    }

    if (this.rtdb) {
      try {
        const snapshot = await get(ref(this.rtdb, 'notifications'));
        if (snapshot.exists()) {
          const val = snapshot.val();
          Object.keys(val).forEach(key => {
            list.push(val[key]);
          });
        }
      } catch (e) {
        console.warn('Realtime DB notifications fetch notice:', e);
      }
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  listenNotificationsFromFirebase(callback: (notifications: AppNotification[]) => void): () => void {
    if (!this.isBrowser() || !this.isFirebaseInitialized) return () => {};

    // Periodic sync interval for live real-time notifications
    const interval = setInterval(async () => {
      const list = await this.fetchNotificationsFromFirebase();
      callback(list);
    }, 4000);

    return () => clearInterval(interval);
  }

  async markNotificationAsReadInFirebase(id: string): Promise<void> {
    if (!this.isBrowser() || !this.isFirebaseInitialized) return;

    if (this.db) {
      try {
        const notifDocRef = doc(this.db, 'notifications', id);
        await setDoc(notifDocRef, { read: true }, { merge: true });
      } catch (e) {}
    }
    if (this.rtdb) {
      try {
        await set(ref(this.rtdb, `notifications/${id}/read`), true);
      } catch (e) {}
    }
  }

  async clearAllNotificationsFromFirebase(): Promise<void> {
    if (!this.isBrowser() || !this.isFirebaseInitialized) return;

    const firestoreDb = this.db;
    if (firestoreDb) {
      try {
        const querySnapshot = await getDocs(collection(firestoreDb, 'notifications'));
        querySnapshot.forEach(async (docSnap: any) => {
          await deleteDoc(doc(firestoreDb, 'notifications', docSnap.id));
        });
      } catch (e) {}
    }
    if (this.rtdb) {
      try {
        await remove(ref(this.rtdb, 'notifications'));
      } catch (e) {}
    }
  }

  // --- Enquiries Firebase Collection API ---
  async saveEnquiry(enquiry: Enquiry): Promise<void> {
    if (!this.isBrowser() || !this.isFirebaseInitialized) return;

    if (this.db) {
      try {
        const enqDocRef = doc(this.db, 'enquiries', enquiry.id);
        await setDoc(enqDocRef, { ...enquiry }, { merge: true });
      } catch (err) {
        console.warn('Firestore enquiry save notice:', err);
      }
    }

    if (this.rtdb) {
      try {
        const enqRtRef = ref(this.rtdb, `enquiries/${enquiry.id}`);
        await set(enqRtRef, { ...enquiry });
      } catch (err) {
        console.warn('Realtime DB enquiry save notice:', err);
      }
    }
  }

  async fetchEnquiriesFromFirebase(): Promise<Enquiry[]> {
    if (!this.isBrowser() || !this.isFirebaseInitialized) return [];

    const list: Enquiry[] = [];

    if (this.db) {
      try {
        const querySnapshot = await getDocs(collection(this.db, 'enquiries'));
        querySnapshot.forEach((docSnap: any) => {
          if (docSnap.exists()) {
            list.push(docSnap.data() as Enquiry);
          }
        });
        if (list.length > 0) {
          return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
      } catch (e) {
        console.warn('Firestore enquiries fetch notice:', e);
      }
    }

    if (this.rtdb) {
      try {
        const snapshot = await get(ref(this.rtdb, 'enquiries'));
        if (snapshot.exists()) {
          const val = snapshot.val();
          Object.keys(val).forEach(key => {
            list.push(val[key]);
          });
        }
      } catch (e) {
        console.warn('Realtime DB enquiries fetch notice:', e);
      }
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateEnquiryStatusInFirebase(id: string, status: EnquiryStatus): Promise<void> {
    if (!this.isBrowser() || !this.isFirebaseInitialized) return;

    if (this.db) {
      try {
        const enqDocRef = doc(this.db, 'enquiries', id);
        await setDoc(enqDocRef, { status }, { merge: true });
      } catch (e) {}
    }
    if (this.rtdb) {
      try {
        await set(ref(this.rtdb, `enquiries/${id}/status`), status);
      } catch (e) {}
    }
  }

  async deleteEnquiryFromFirebase(id: string): Promise<void> {
    if (!this.isBrowser() || !this.isFirebaseInitialized) return;

    const firestoreDb = this.db;
    if (firestoreDb) {
      try {
        await deleteDoc(doc(firestoreDb, 'enquiries', id));
      } catch (e) {}
    }
    if (this.rtdb) {
      try {
        await remove(ref(this.rtdb, `enquiries/${id}`));
      } catch (e) {}
    }
  }

  async logout(): Promise<void> {
    if (this.auth && this.isBrowser()) {
      try {
        await signOut(this.auth);
      } catch (err) {
        console.error('Firebase signOut error', err);
      }
    }
  }

  listenAuthState(callback: (user: FirebaseUser | null) => void): void {
    if (this.auth && this.isBrowser()) {
      onAuthStateChanged(this.auth, callback);
    }
  }

  get isInitialized(): boolean {
    return this.isFirebaseInitialized;
  }
}
