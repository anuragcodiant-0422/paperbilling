import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-add-customer-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="header-title-group">
            <h2 class="modal-title">Add New Customer</h2>
            <p class="header-subtitle">Create a customer profile to track invoices and payments.</p>
          </div>
          <button class="modal-close" (click)="onClose()">&times;</button>
        </div>

        <form (ngSubmit)="onSubmit()">
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Customer / Contact Name *</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="e.g. Jane Doe or Apex Tech"
                  [(ngModel)]="name"
                  name="name"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Company / Organization</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="e.g. Acme Corp Inc."
                  [(ngModel)]="company"
                  name="company"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Email Address *</label>
                <input
                  type="email"
                  class="form-control"
                  placeholder="e.g. billing@company.com"
                  [(ngModel)]="email"
                  name="email"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input
                  type="tel"
                  class="form-control"
                  placeholder="e.g. +1 (555) 019-2834"
                  [(ngModel)]="phone"
                  name="phone"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Billing Address</label>
              <input
                type="text"
                class="form-control"
                placeholder="Street, City, State, ZIP code"
                [(ngModel)]="address"
                name="address"
              />
            </div>

            @if (errorMessage()) {
              <div class="error-alert">
                {{ errorMessage() }}
              </div>
            }
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="onClose()">Cancel</button>
            <button type="submit" class="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Save Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .header-title-group {
      display: flex;
      flex-direction: column;
    }

    .header-subtitle {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
    }

    .input-prefix-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .currency-prefix {
      position: absolute;
      left: 0.875rem;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.9rem;
      pointer-events: none;
    }

    .padded-prefix {
      padding-left: 2rem !important;
    }

    .help-text {
      display: block;
      font-size: 0.75rem;
      color: var(--text-dim);
      margin-top: 0.35rem;
    }

    .error-alert {
      background-color: var(--danger-bg);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: var(--danger);
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      font-size: 0.8125rem;
      font-weight: 500;
      margin-top: 0.5rem;
    }
  `]
})
export class AddCustomerModalComponent {
  private customerService = inject(CustomerService);

  close = output<void>();
  customerAdded = output<string>();

  name = '';
  company = '';
  email = '';
  phone = '';
  address = '';
  totalBilled: number | null = null;
  errorMessage = signal<string>('');

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (!this.name.trim()) {
      this.errorMessage.set('Customer name is required.');
      return;
    }
    if (!this.email.trim()) {
      this.errorMessage.set('Email address is required.');
      return;
    }
    const created = this.customerService.addCustomer({
      name: this.name.trim(),
      company: this.company.trim() || 'N/A',
      email: this.email.trim(),
      phone: this.phone.trim() || 'N/A',
      address: this.address.trim() || 'N/A',
      totalBilled: 0,
      status: 'Active'
    });

    this.customerAdded.emit(created.id);
    this.onClose();
  }
}
