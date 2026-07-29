import { Injectable, signal, computed, inject } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { Enquiry, EnquiryStatus } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class EnquiryService {
  private firebaseService = inject(FirebaseService);

  readonly enquiries = signal<Enquiry[]>([]);

  readonly newCount = computed(() => {
    return this.enquiries().filter(e => e.status === 'New').length;
  });

  constructor() {
    this.loadEnquiries();
  }

  async loadEnquiries(): Promise<void> {
    try {
      const list = await this.firebaseService.fetchEnquiriesFromFirebase();
      this.enquiries.set(list || []);
    } catch (e) {
      console.warn('Enquiries load notice:', e);
    }
  }

  async addEnquiry(data: Omit<Enquiry, 'id' | 'createdAt' | 'status'>): Promise<Enquiry> {
    const newEnquiry: Enquiry = {
      ...data,
      id: `enq-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'New'
    };

    this.enquiries.update(list => [newEnquiry, ...list]);
    await this.firebaseService.saveEnquiry(newEnquiry);
    return newEnquiry;
  }

  async updateStatus(id: string, status: EnquiryStatus): Promise<void> {
    this.enquiries.update(list =>
      list.map(e => (e.id === id ? { ...e, status } : e))
    );
    await this.firebaseService.updateEnquiryStatusInFirebase(id, status);
  }

  async deleteEnquiry(id: string): Promise<void> {
    this.enquiries.update(list => list.filter(e => e.id !== id));
    await this.firebaseService.deleteEnquiryFromFirebase(id);
  }
}
