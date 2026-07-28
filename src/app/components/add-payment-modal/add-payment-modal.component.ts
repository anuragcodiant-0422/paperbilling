import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../services/customer.service';
import { AuthService } from '../../services/auth.service';
import { Customer, PaymentMethod, PaymentStatus } from '../../models/customer.model';

@Component({
  selector: 'app-add-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="header-title-group">
            <h2 class="modal-title">Record Payment</h2>
            <p class="header-subtitle">Log a new payment for <strong>{{ customer()?.name }}</strong></p>
          </div>
          <button class="modal-close" (click)="onClose()">&times;</button>
        </div>

        <!-- Customer Summary Banner -->
        @if (customer(); as cust) {
          <div class="customer-pay-banner">
            <div class="banner-item">
              <span class="b-label">Total Payments Made</span>
              <span class="b-val text-success">\${{ cust.totalPaid | number:'1.2-2' }}</span>
            </div>
          </div>
        }

        <form (ngSubmit)="onSubmit()">
          <div class="modal-body">
            <!-- Scan QR Code Helper Box -->
            <div class="qr-helper-box">
              <div class="qr-helper-left">
                <img src="/Image.png" alt="Payment QR" class="qr-helper-thumb" />
                <div>
                  <span class="qr-helper-title">Scan Payment QR Code</span>
                  <p class="qr-helper-sub">Scan using GPay, PhonePe, Paytm, or UPI</p>
                </div>
              </div>
              <a href="/Image.png" download="Payment_QR_Code.png" class="btn-qr-dl" title="Download QR Image">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download QR
              </a>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Payment Amount ($) *</label>
                <div class="input-prefix-wrapper">
                  <span class="currency-prefix">$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    class="form-control padded-prefix"
                    placeholder="0.00"
                    [(ngModel)]="amount"
                    name="amount"
                    required
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Payment Date *</label>
                <input
                  type="date"
                  class="form-control"
                  [(ngModel)]="paymentDate"
                  name="paymentDate"
                  required
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Payment Method *</label>
                <select class="form-control" [(ngModel)]="paymentMethod" name="paymentMethod">
                  <option value="Credit Card">Credit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI / PayPal">UPI / PayPal</option>
                  <option value="Check">Check</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Reference / Txn ID (Optional)</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Optional reference or Txn ID"
                  [(ngModel)]="referenceNumber"
                  name="referenceNumber"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Notes / Purpose (Optional)</label>
              <textarea
                class="form-control"
                rows="2"
                placeholder="Optional notes or purpose"
                [(ngModel)]="notes"
                name="notes"
              ></textarea>
            </div>

            @if (errorMessage()) {
              <div class="error-alert">
                {{ errorMessage() }}
              </div>
            }
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="onClose()" [disabled]="isSubmitting()">Cancel</button>
            <button type="submit" class="btn btn-success" [disabled]="isSubmitting()">
              <span class="btn-icon">$</span>
              {{ isSubmitting() ? 'Saving...' : 'Confirm & Record Payment' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(10, 15, 30, 0.8);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease-out;
    }

    .modal-container {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 580px;
      overflow: hidden;
      box-shadow: var(--shadow-modal);
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.02);
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-main);
      margin: 0;
    }

    .header-subtitle {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    .modal-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.5rem;
      cursor: pointer;
      line-height: 1;
      padding: 0.25rem;
      border-radius: 4px;
      transition: all 0.15s ease;
    }

    .modal-close:hover {
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.1);
    }

    .customer-pay-banner {
      display: flex;
      justify-content: center;
      background: rgba(15, 23, 42, 0.7);
      border-bottom: 1px solid var(--border-color);
      padding: 0.875rem 1.5rem;
    }

    .banner-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .b-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-dim);
    }

    .b-val {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--text-main);
      margin-top: 0.15rem;
    }

    .text-success { color: #34d399; }

    .modal-body {
      padding: 1.5rem;
    }

    .qr-helper-box {
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: var(--radius-md);
      padding: 0.85rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
      gap: 1rem;
    }

    .qr-helper-left {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .qr-helper-thumb {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: #ffffff;
      padding: 3px;
    }

    .qr-helper-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-main);
      display: block;
    }

    .qr-helper-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin: 0;
    }

    .btn-qr-dl {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
      padding: 0.4rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .btn-qr-dl:hover {
      background: rgba(16, 185, 129, 0.3);
      color: #ffffff;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 1rem;
    }

    .form-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-main);
    }

    .input-prefix-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .currency-prefix {
      position: absolute;
      left: 1rem;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 1rem;
    }

    .padded-prefix {
      padding-left: 2.2rem !important;
    }

    .form-control {
      width: 100%;
      padding: 0.7rem 0.9rem;
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      color: var(--text-main);
      font-size: 0.9rem;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }

    textarea.form-control {
      resize: vertical;
    }

    .error-alert {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      margin-top: 0.5rem;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      background: rgba(15, 23, 42, 0.4);
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .btn-icon {
      font-weight: 700;
      margin-right: 0.25rem;
    }
  `]
})
export class AddPaymentModalComponent {
  private customerService = inject(CustomerService);
  private authService = inject(AuthService);

  customer = input<Customer | undefined>();
  close = output<void>();
  paymentAdded = output<void>();

  amount: number | null = null;
  paymentDate: string = new Date().toISOString().split('T')[0];
  paymentMethod: PaymentMethod = 'Bank Transfer';
  referenceNumber: string = '';
  notes: string = '';
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.isSubmitting()) return;

    const cust = this.customer();
    if (!cust) return;

    if (!this.amount || this.amount <= 0) {
      this.errorMessage.set('Please enter a valid payment amount greater than zero.');
      return;
    }

    this.isSubmitting.set(true);
    const defaultStatus: PaymentStatus = this.authService.isAdmin() ? 'Complete' : 'Pending';

    this.customerService.addPayment({
      customerId: cust.id,
      amount: Number(this.amount),
      paymentDate: this.paymentDate,
      paymentMethod: this.paymentMethod,
      referenceNumber: this.referenceNumber.trim() || 'N/A',
      notes: this.notes.trim() || 'Payment received',
      status: defaultStatus
    });

    this.paymentAdded.emit();
    this.onClose();
  }
}
