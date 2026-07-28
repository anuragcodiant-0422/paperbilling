import { Injectable, signal, computed, inject } from '@angular/core';
import { Customer, Payment, PaymentStatus, FinancialSummary } from '../models/customer.model';
import { FirebaseService } from './firebase.service';

const AVATAR_COLORS = [
  '#4f46e5', '#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#0891b2', '#c026d3'
];

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private firebaseService = inject(FirebaseService);

  readonly customers = signal<Customer[]>([]);
  readonly payments = signal<Payment[]>([]);

  readonly financialSummary = computed<FinancialSummary>(() => {
    const custs = this.customers();
    const totalCustomers = custs.length;
    const totalBilled = custs.reduce((sum, c) => sum + c.totalBilled, 0);
    const totalCollected = custs.reduce((sum, c) => sum + c.totalPaid, 0);
    const totalOutstanding = custs.reduce((sum, c) => sum + c.balanceDue, 0);

    return {
      totalCustomers,
      totalBilled,
      totalCollected,
      totalOutstanding
    };
  });

  constructor() {
    this.loadDataFromFirebase();
  }

  async loadDataFromFirebase(): Promise<void> {
    try {
      const fbCustomers = await this.firebaseService.fetchCustomersFromFirebase();
      const fbPayments = await this.firebaseService.fetchPaymentsFromFirebase();

      // Deduplicate customers by email so each customer account appears exactly ONCE
      const uniqueMap = new Map<string, Customer>();
      (fbCustomers || []).forEach(c => {
        if (!c.id.startsWith('cust-10')) {
          const emailKey = c.email.toLowerCase().trim();
          const existing = uniqueMap.get(emailKey);
          if (!existing || (c.totalPaid > (existing.totalPaid || 0))) {
            uniqueMap.set(emailKey, c);
          }
        }
      });

      const realCustomers = Array.from(uniqueMap.values());
      const realPayments = (fbPayments || []).filter(p => !p.id.startsWith('pay-20'));

      this.customers.set(realCustomers);
      this.payments.set(realPayments);
    } catch (e) {
      console.warn('Firebase data load notice:', e);
      this.customers.set([]);
      this.payments.set([]);
    }
  }

  getCustomerById(id: string): Customer | undefined {
    return this.customers().find(c => c.id === id);
  }

  getPaymentsByCustomerId(customerId: string): Payment[] {
    const targetCust = this.getCustomerById(customerId);
    const targetEmail = targetCust?.email?.toLowerCase();

    return this.payments()
      .filter(p => {
        if (p.customerId === customerId) return true;
        if (targetEmail) {
          const pCust = this.customers().find(c => c.id === p.customerId);
          if (pCust && pCust.email.toLowerCase() === targetEmail) return true;
        }
        return false;
      })
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }

  addCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'totalPaid' | 'balanceDue' | 'avatarColor'>): Customer {
    // Check if a customer profile for this email already exists
    const existing = this.customers().find(c => c.email.toLowerCase() === customerData.email.toLowerCase().trim());
    if (existing) {
      return existing;
    }

    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      totalPaid: 0,
      balanceDue: customerData.totalBilled,
      avatarColor: randomColor
    };

    this.customers.update(custs => [newCustomer, ...custs]);
    // Save customer directly to Firebase API
    this.firebaseService.saveCustomer(newCustomer);
    return newCustomer;
  }

  updateCustomer(id: string, updatedData: Partial<Customer>): void {
    let updatedCust: Customer | undefined;
    this.customers.update(custs =>
      custs.map(c => {
        if (c.id === id) {
          const newBilled = updatedData.totalBilled !== undefined ? updatedData.totalBilled : c.totalBilled;
          const newPaid = c.totalPaid;
          updatedCust = {
            ...c,
            ...updatedData,
            totalBilled: newBilled,
            balanceDue: Math.max(0, newBilled - newPaid)
          };
          return updatedCust;
        }
        return c;
      })
    );

    if (updatedCust) {
      this.firebaseService.saveCustomer(updatedCust);
    }
  }

  deleteCustomer(id: string): void {
    this.customers.update(custs => custs.filter(c => c.id !== id));
    this.payments.update(pays => pays.filter(p => p.customerId !== id));
    this.firebaseService.deleteCustomerFromFirebase(id);
  }

  addPayment(paymentData: Omit<Payment, 'id'>): Payment {
    const newPayment: Payment = {
      ...paymentData,
      id: `pay-${Date.now()}`
    };

    this.payments.update(pays => [newPayment, ...pays]);

    let updatedCust: Customer | undefined;
    this.customers.update(custs =>
      custs.map(c => {
        if (c.id === paymentData.customerId) {
          const newTotalPaid = c.totalPaid + paymentData.amount;
          const newBalance = Math.max(0, c.totalBilled - newTotalPaid);
          updatedCust = {
            ...c,
            totalPaid: newTotalPaid,
            balanceDue: newBalance
          };
          return updatedCust;
        }
        return c;
      })
    );

    // Save payment & updated customer directly to Firebase API
    this.firebaseService.savePayment(newPayment);
    if (updatedCust) {
      this.firebaseService.saveCustomer(updatedCust);
    }

    return newPayment;
  }

  updatePaymentStatus(paymentId: string, status: PaymentStatus): void {
    let updatedPayment: Payment | undefined;

    this.payments.update(pays =>
      pays.map(p => {
        if (p.id === paymentId) {
          updatedPayment = { ...p, status };
          return updatedPayment;
        }
        return p;
      })
    );

    if (updatedPayment) {
      this.firebaseService.savePayment(updatedPayment);
    }
  }

  deletePayment(paymentId: string): void {
    const payment = this.payments().find(p => p.id === paymentId);
    if (!payment) return;

    const customerId = payment.customerId;
    const amount = payment.amount;

    this.payments.update(pays => pays.filter(p => p.id !== paymentId));

    let updatedCust: Customer | undefined;
    this.customers.update(custs =>
      custs.map(c => {
        if (c.id === customerId) {
          const newTotalPaid = Math.max(0, c.totalPaid - amount);
          const newBalance = Math.max(0, c.totalBilled - newTotalPaid);
          updatedCust = {
            ...c,
            totalPaid: newTotalPaid,
            balanceDue: newBalance
          };
          return updatedCust;
        }
        return c;
      })
    );

    this.firebaseService.deletePaymentFromFirebase(paymentId);
    if (updatedCust) {
      this.firebaseService.saveCustomer(updatedCust);
    }
  }

  resetDataToDefault(): void {
    this.loadDataFromFirebase();
  }
}
