export type PaymentMethod = 'Credit Card' | 'Bank Transfer' | 'Cash' | 'UPI / PayPal' | 'Check';
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
