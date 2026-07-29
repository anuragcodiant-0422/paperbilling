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
                  <option value="Google Pay">Google Pay</option>
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

            <!-- Payment Screenshot / Proof Upload -->
            <div class="form-group">
              <label class="form-label">Payment Screenshot / Proof (Optional)</label>
              @if (screenshotUrl()) {
                <div class="ss-preview-box">
                  <img [src]="screenshotUrl()" alt="Payment Screenshot Preview" class="ss-preview-img" (click)="showSsFull.set(true)" title="Click to Expand Screenshot" />
                  <div class="ss-preview-actions">
                    <span class="ss-file-badge">✓ Screenshot Attached</span>
                    <button type="button" class="btn-ss-remove" (click)="removeScreenshot()">
                      ✕ Remove Screenshot
                    </button>
                  </div>
                </div>
              } @else {
                <div
                  class="ss-dropzone"
                  [class.dragover]="isDragging()"
                  (dragover)="onDragOver($event)"
                  (dragleave)="onDragLeave($event)"
                  (drop)="onDrop($event)"
                  (click)="fileInput.click()"
                >
                  <input
                    #fileInput
                    type="file"
                    accept="image/*"
                    class="hidden-file-input"
                    (change)="onFileSelected($event)"
                  />
                  <div class="dropzone-content">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span class="dz-title">Upload Payment Screenshot</span>
                    <span class="dz-sub">Drag & drop image here or click to select (PNG, JPG, WEBP)</span>
                  </div>
                </div>
              }
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

    <!-- Full-screen Screenshot Lightbox Modal -->
    @if (showSsFull() && screenshotUrl()) {
      <div class="ss-modal-overlay" (click)="showSsFull.set(false)">
        <div class="ss-modal-content" (click)="$event.stopPropagation()">
          <div class="ss-modal-header">
            <h3>Payment Screenshot Proof</h3>
            <button class="modal-close" (click)="showSsFull.set(false)">&times;</button>
          </div>
          <div class="ss-modal-body">
            <img [src]="screenshotUrl()" alt="Full Payment Screenshot" class="full-ss-img" />
          </div>
        </div>
      </div>
    }
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

    @media (max-width: 640px) {
      .form-row {
        grid-template-columns: 1fr !important;
        gap: 0.5rem;
      }

      .qr-helper-box {
        flex-direction: column;
        align-items: stretch;
        text-align: center;
      }

      .qr-helper-left {
        flex-direction: column;
      }

      .btn-qr-dl {
        justify-content: center;
      }
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

    .qr-helper-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .btn-gpay-app-sm {
      background: linear-gradient(135deg, #1a73e8, #1557b0);
      color: #ffffff;
      padding: 0.45rem 0.85rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      transition: all 0.15s ease;

      &:hover {
        background: linear-gradient(135deg, #1557b0, #0d47a1);
        box-shadow: 0 4px 12px rgba(26, 115, 232, 0.4);
      }
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

    .hidden-file-input {
      display: none;
    }

    .ss-dropzone {
      border: 2px dashed rgba(99, 102, 241, 0.4);
      background: rgba(99, 102, 241, 0.05);
      border-radius: var(--radius-md);
      padding: 1.25rem 1rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover, &.dragover {
        border-color: #818cf8;
        background: rgba(99, 102, 241, 0.12);
      }
    }

    .dropzone-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      color: var(--text-muted);
    }

    .dz-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .dz-sub {
      font-size: 0.75rem;
      color: var(--text-dim);
    }

    .ss-preview-box {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.75rem 1rem;
    }

    .ss-preview-img {
      width: 64px;
      height: 64px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      cursor: pointer;
      transition: transform 0.15s ease;

      &:hover {
        transform: scale(1.05);
      }
    }

    .ss-preview-actions {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .ss-file-badge {
      font-size: 0.775rem;
      font-weight: 700;
      color: #34d399;
    }

    .btn-ss-remove {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
      padding: 0.25rem 0.6rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: rgba(239, 68, 68, 0.3);
        color: #ffffff;
      }
    }

    .ss-modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(10, 15, 30, 0.9);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1200;
      padding: 1.5rem;
      animation: fadeIn 0.2s ease-out;
    }

    .ss-modal-content {
      background: var(--bg-card);
      border: 1px solid var(--border-highlight);
      border-radius: var(--radius-lg);
      max-width: 800px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-modal);
    }

    .ss-modal-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;

      h3 {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--text-main);
        margin: 0;
      }
    }

    .ss-modal-body {
      padding: 1.25rem;
      overflow: auto;
      text-align: center;
      background: rgba(0, 0, 0, 0.3);
    }

    .full-ss-img {
      max-width: 100%;
      max-height: 70vh;
      object-fit: contain;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
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
  screenshotUrl = signal<string>('');
  isDragging = signal<boolean>(false);
  showSsFull = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  onClose(): void {
    this.close.emit();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  private processFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage.set('Image file size exceeds 5MB limit. Please select a smaller file.');
      return;
    }
    this.errorMessage.set('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      this.screenshotUrl.set(result);
    };
    reader.readAsDataURL(file);
  }

  removeScreenshot(): void {
    this.screenshotUrl.set('');
  }

  openGooglePayApp(): void {
    const cust = this.customer();
    const upiVpa = 'anuragbagdi6635-1@okicici';
    const merchantName = encodeURIComponent('PaperBilling');
    const note = encodeURIComponent(`Bill Payment for ${cust?.name || 'Customer'}`);
    const amountParam = (this.amount && this.amount > 0) ? `&am=${this.amount}` : '';

    const gpayAndroidIntent = `intent://pay?pa=${upiVpa}&pn=${merchantName}${amountParam}&cu=INR&tn=${note}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end;`;
    const gpayScheme = `gpay://upi/pay?pa=${upiVpa}&pn=${merchantName}${amountParam}&cu=INR&tn=${note}`;
    const standardUpiUrl = `upi://pay?pa=${upiVpa}&pn=${merchantName}${amountParam}&cu=INR&tn=${note}`;

    const isAndroid = /Android/i.test(navigator.userAgent);
    try {
      window.location.href = isAndroid ? gpayAndroidIntent : gpayScheme;
    } catch (e) {
      window.location.href = standardUpiUrl;
    }

    this.paymentMethod = 'Google Pay';
    if (!this.notes) {
      this.notes = 'Payment redirected to Google Pay app';
    }
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
      screenshotUrl: this.screenshotUrl() || undefined,
      status: defaultStatus
    });

    this.paymentAdded.emit();
    this.onClose();
  }
}
