import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthUser } from '../models/user.model';
import { CustomerService } from './customer.service';
import { FirebaseService } from './firebase.service';
import { AppNotification } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private customerService = inject(CustomerService);
  private firebaseService = inject(FirebaseService);

  readonly currentUser = signal<AuthUser | null>(null);

  readonly isLoggedIn = computed(() => !!this.currentUser());
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly isCustomer = computed(() => this.currentUser()?.role === 'customer');

  constructor() {
    this.restoreSession();
    this.initFirebaseListener();
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private restoreSession(): void {
    if (!this.isBrowser()) return;
    try {
      const saved = localStorage.getItem('paperbilling_user_session');
      if (saved) {
        const parsed = JSON.parse(saved) as AuthUser;
        if (parsed && parsed.email) {
          this.currentUser.set(parsed);
        }
      }
    } catch (e) {
      console.warn('Session restore notice:', e);
    }
  }

  private persistSession(user: AuthUser | null): void {
    if (!this.isBrowser()) return;
    try {
      if (user) {
        localStorage.setItem('paperbilling_user_session', JSON.stringify(user));
      } else {
        localStorage.removeItem('paperbilling_user_session');
      }
    } catch (e) {}
  }

  private initFirebaseListener(): void {
    if (!this.isBrowser()) return;

    // Listen to Firebase Auth state directly
    this.firebaseService.listenAuthState((fbUser) => {
      if (fbUser) {
        const email = fbUser.email || '';
        const customers = this.customerService.customers();
        const matched = customers.find(c => c.email.toLowerCase() === email.toLowerCase());

        const syncedUser: AuthUser = {
          id: fbUser.uid,
          email: email,
          name: fbUser.displayName || matched?.name || email.split('@')[0],
          role: email.toLowerCase().includes('admin') ? 'admin' : 'customer',
          customerId: matched?.id
        };
        this.currentUser.set(syncedUser);
        this.persistSession(syncedUser);
      }
    });
  }

  async login(emailInput: string, passwordInput: string): Promise<{ success: boolean; message?: string }> {
    const email = emailInput.trim().toLowerCase();
    const password = passwordInput.trim();

    // 1. Check Admin Credentials Fallback
    if (email === 'admin@paperbilling.com' || (email === 'admin' && (password === 'admin' || password === 'admin123'))) {
      const adminUser: AuthUser = {
        id: 'user-admin',
        email: 'admin@paperbilling.com',
        name: 'System Admin',
        role: 'admin'
      };
      this.currentUser.set(adminUser);
      this.persistSession(adminUser);
      return { success: true };
    }

    // 2. Authenticate Customer via Firebase Auth API
    if (this.firebaseService.isInitialized) {
      const fbResult = await this.firebaseService.login(email, password);
      if (fbResult.error) {
        return { success: false, message: fbResult.error };
      }
      if (fbResult.user) {
        const customers = this.customerService.customers();
        const matched = customers.find(c => c.email.toLowerCase() === email);

        const authUser: AuthUser = {
          id: fbResult.user.uid,
          email: fbResult.user.email || email,
          name: fbResult.user.displayName || matched?.name || email.split('@')[0],
          role: email.includes('admin') ? 'admin' : 'customer',
          customerId: matched?.id
        };

        this.currentUser.set(authUser);
        this.persistSession(authUser);
        return { success: true };
      }
    }

    return {
      success: false,
      message: 'Invalid email or password. Please register an account first under "New Customer Register".'
    };
  }

  async registerCustomer(data: {
    name: string;
    email: string;
    phone: string;
    company: string;
    address: string;
    password?: string;
  }): Promise<{ success: boolean; message?: string }> {
    const email = data.email.trim().toLowerCase();
    const password = data.password || 'password123';

    // 1. Register user with Firebase Authentication API
    if (this.firebaseService.isInitialized) {
      const fbResult = await this.firebaseService.register(email, password);
      if (fbResult.error) {
        return { success: false, message: fbResult.error };
      }
    }

    // 2. Create customer record in Firebase Database
    const created = this.customerService.addCustomer({
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim() || 'N/A',
      company: data.company.trim() || 'Individual',
      address: data.address.trim() || 'N/A',
      totalBilled: 2000,
      status: 'Active'
    });

    // 3. Save Admin Notification to Firebase
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      type: 'NEW_REGISTRATION',
      title: '👤 New Customer Registered',
      message: `${data.name.trim()} (${data.email.trim()}) registered a new customer account. Phone: ${data.phone.trim() || 'N/A'}`,
      customerName: data.name.trim(),
      customerEmail: data.email.trim(),
      customerPhone: data.phone.trim() || 'N/A',
      createdAt: new Date().toISOString(),
      read: false
    };
    await this.firebaseService.saveNotification(notif);

    return {
      success: true,
      message: `Account "${created.name}" registered and saved in Firebase! Please Sign In.`
    };
  }

  async logout(): Promise<void> {
    await this.firebaseService.logout();
    this.currentUser.set(null);
    this.persistSession(null);
  }
}
