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
import { Customer, Payment } from '../models/customer.model';

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
