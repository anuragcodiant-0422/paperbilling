declare module 'firebase/app' {
  export interface FirebaseApp {
    name: string;
    options: Record<string, any>;
  }
  export function initializeApp(options: Record<string, any>, name?: string): FirebaseApp;
  export function getApps(): FirebaseApp[];
  export function getApp(name?: string): FirebaseApp;
}

declare module 'firebase/auth' {
  export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  }

  export interface UserCredential {
    user: User;
  }

  export interface Auth {
    currentUser: User | null;
  }

  export function getAuth(app?: any): Auth;
  export function signInWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>;
  export function createUserWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>;
  export function signOut(auth: Auth): Promise<void>;
  export function onAuthStateChanged(auth: Auth, nextOrObserver: (user: User | null) => void): () => void;
}

declare module 'firebase/firestore' {
  export interface Firestore {}
  export interface DocumentReference {}
  export interface CollectionReference {}

  export function getFirestore(app?: any): Firestore;
  export function doc(db: Firestore, path: string, ...pathSegments: string[]): DocumentReference;
  export function collection(db: Firestore, path: string, ...pathSegments: string[]): CollectionReference;
  export function setDoc(docRef: DocumentReference, data: Record<string, any>, options?: { merge?: boolean }): Promise<void>;
  export function deleteDoc(docRef: DocumentReference): Promise<void>;
  export function getDocs(query: CollectionReference): Promise<any>;
}

declare module 'firebase/database' {
  export interface Database {}
  export interface DatabaseReference {}
  export interface DataSnapshot {
    val(): any;
    exists(): boolean;
  }

  export function getDatabase(app?: any): Database;
  export function ref(db: Database, path?: string): DatabaseReference;
  export function set(ref: DatabaseReference, value: any): Promise<void>;
  export function get(ref: DatabaseReference): Promise<DataSnapshot>;
  export function remove(ref: DatabaseReference): Promise<void>;
}
