import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { CustomerListComponent } from './components/customer-list/customer-list.component';
import { CustomerDetailComponent } from './components/customer-detail/customer-detail.component';
import { AddCustomerModalComponent } from './components/add-customer-modal/add-customer-modal.component';
import { AddPaymentModalComponent } from './components/add-payment-modal/add-payment-modal.component';
import { PaymentReceiptModalComponent } from './components/payment-receipt-modal/payment-receipt-modal.component';
import { AuthComponent } from './components/auth/auth.component';
import { CustomerPortalComponent } from './components/customer-portal/customer-portal.component';

import { Customer, Payment } from './models/customer.model';
import { CustomerService } from './services/customer.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    CustomerListComponent,
    CustomerDetailComponent,
    AddCustomerModalComponent,
    AddPaymentModalComponent,
    PaymentReceiptModalComponent,
    AuthComponent,
    CustomerPortalComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private customerService = inject(CustomerService);
  auth = inject(AuthService);

  isAddCustomerOpen = signal<boolean>(false);
  selectedCustomer = signal<Customer | undefined>(undefined);
  customerForPayment = signal<Customer | undefined>(undefined);
  activeReceipt = signal<{ customer?: Customer; payment?: Payment } | undefined>(undefined);

  openAddCustomerModal(): void {
    this.isAddCustomerOpen.set(true);
  }

  closeAddCustomerModal(): void {
    this.isAddCustomerOpen.set(false);
  }

  onCustomerAdded(customerId: string): void {
    const cust = this.customerService.getCustomerById(customerId);
    if (cust) {
      this.selectedCustomer.set(cust);
    }
  }

  openCustomerDetail(customer: Customer): void {
    const latest = this.customerService.getCustomerById(customer.id);
    this.selectedCustomer.set(latest || customer);
  }

  closeCustomerDetail(): void {
    this.selectedCustomer.set(undefined);
  }

  openAddPayment(customer?: Customer): void {
    if (customer) {
      const latest = this.customerService.getCustomerById(customer.id);
      this.customerForPayment.set(latest || customer);
      return;
    }

    const currentUser = this.auth.currentUser();
    if (currentUser) {
      let cust = currentUser.customerId ? this.customerService.getCustomerById(currentUser.customerId) : undefined;

      if (!cust && currentUser.email) {
        cust = this.customerService.customers().find(c => c.email.toLowerCase() === currentUser.email.toLowerCase());
      }

      this.customerForPayment.set(cust);
    }
  }

  closeAddPayment(): void {
    this.customerForPayment.set(undefined);
  }

  onPaymentAdded(): void {
    const active = this.selectedCustomer();
    if (active) {
      const updated = this.customerService.getCustomerById(active.id);
      this.selectedCustomer.set(updated);
    }
  }

  openReceipt(payment: Payment): void {
    const cust = this.selectedCustomer() || this.customerService.getCustomerById(payment.customerId);
    this.activeReceipt.set({ customer: cust, payment });
  }

  closeReceipt(): void {
    this.activeReceipt.set(undefined);
  }
}
