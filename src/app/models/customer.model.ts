export type PaymentMethod = 'Credit Card' | 'Bank Transfer' | 'Cash' | 'UPI / PayPal' | 'Check' | 'Google Pay';
export type PaymentStatus = 'Pending' | 'Complete' | 'Cancel';
export type CustomerStatus = 'Active' | 'Inactive';

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  paymentDate: string; // ISO string format YYYY-MM-DD
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  notes?: string;
  screenshotUrl?: string;
  status: PaymentStatus;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  createdAt: string;
  totalBilled: number;
  totalPaid: number;
  balanceDue: number;
  status: CustomerStatus;
  avatarColor?: string;
}

export interface FinancialSummary {
  totalCustomers: number;
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
}

export interface AppNotification {
  id: string;
  type: 'NEW_REGISTRATION' | 'NEW_PAYMENT';
  title: string;
  message: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  createdAt: string;
  read: boolean;
}

export type EnquiryStatus = 'New' | 'Read' | 'Resolved';

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  createdAt: string;
  status: EnquiryStatus;
}
