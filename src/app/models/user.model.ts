export type UserRole = 'admin' | 'customer';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  customerId?: string; // Linked customer ID if role is 'customer'
}
