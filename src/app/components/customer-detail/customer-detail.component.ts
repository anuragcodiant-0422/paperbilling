import { Component, inject, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../services/customer.service';
import { Customer, Payment, PaymentStatus } from '../../models/customer.model';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="customer-detail-page">
      <!-- Top Navigation & Action Bar -->
      <div class="top-nav-bar">
        <button class="btn btn-secondary btn-sm back-btn" (click)="back.emit()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Customer List
        </button>

        <div class="top-actions">
          <button class="btn btn-success" (click)="openAddPaymentModal.emit()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="18" y1="12" x2="6" y2="12"></line>
            </svg>
            Record New Payment
          </button>
          <button class="btn btn-danger-outline btn-sm" (click)="onDeleteCustomer()">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Delete Customer
          </button>
        </div>
      </div>

      @if (customer(); as cust) {
        <!-- Customer Identity Hero Banner -->
        <div class="customer-hero-card">
          <div class="hero-main">
            <div class="avatar-xl" [style.background-color]="cust.avatarColor || '#4f46e5'">
              {{ getInitials(cust.name) }}
            </div>
            <div class="hero-details">
              <div class="title-row">
                <h2 class="hero-name">{{ cust.name }}</h2>
                <span class="badge" [class]="getStatusBadgeClass(cust)">
                  {{ getStatusBadgeText(cust) }}
                </span>
              </div>
              <p class="hero-company">{{ cust.company }}</p>

              <div class="contact-chips">
                <div class="chip">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  {{ cust.email }}
                </div>
                <div class="chip">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  {{ cust.phone }}
                </div>
                <div class="chip">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  {{ cust.address }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Payments Overview Dashboard -->
        <div class="financial-dashboard-grid">
          <div class="fin-card">
            <span class="fin-label">Total Payments Made</span>
            <div class="fin-val text-success">\${{ cust.totalPaid | number:'1.2-2' }}</div>
            <span class="fin-sub">Sum of all cleared payments</span>
          </div>

          <div class="fin-card">
            <span class="fin-label">Total Transactions</span>
            <div class="fin-val">{{ customerPayments().length }}</div>
            <span class="fin-sub">Recorded payment logs</span>
          </div>

          <div class="fin-card">
            <span class="fin-label">Customer Member Since</span>
            <div class="fin-val text-date">{{ cust.createdAt }}</div>
            <span class="fin-sub">Account creation date</span>
          </div>
        </div>

        <!-- Payment History Full Table View Component -->
        <div class="payment-history-panel">
          <div class="panel-header">
            <div class="panel-title-group">
              <h3 class="panel-title">Payment History & Transactions</h3>
              <p class="panel-sub">Complete transaction logs for {{ cust.name }}</p>
            </div>
            <span class="tx-badge">{{ customerPayments().length }} Recorded Payment(s)</span>
          </div>

          @if (customerPayments().length === 0) {
            <div class="empty-payments-state">
              <div class="empty-payment-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
              </div>
              <h4>No Payments Recorded Yet</h4>
              <p>There are no transaction records logged for this customer profile.</p>
              <button class="btn btn-success btn-sm mt-3" (click)="openAddPaymentModal.emit()">
                Log First Payment
              </button>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="history-table">
                <thead>
                  <tr>
                    <th>Payment Date</th>
                    <th>Payment Method</th>
                    <th>Reference / Txn ID</th>
                    <th>Notes / Purpose</th>
                    <th>Amount Paid</th>
                    <th>Screenshot</th>
                    <th>Verify</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (pay of customerPayments(); track pay.id) {
                    <tr>
                      <td class="date-cell">{{ pay.paymentDate }}</td>
                      <td>
                        <span class="method-badge">{{ pay.paymentMethod }}</span>
                      </td>
                      <td><code class="ref-code">{{ pay.referenceNumber }}</code></td>
                      <td class="notes-cell">{{ pay.notes || 'N/A' }}</td>
                      <td class="amount-cell text-success">\${{ pay.amount | number:'1.2-2' }}</td>
                      <td>
                        @if (pay.screenshotUrl) {
                          <div class="ss-table-cell" (click)="activeScreenshotUrl.set(pay.screenshotUrl)" title="Click to view payment screenshot">
                            <img [src]="pay.screenshotUrl" alt="SS" class="ss-thumb" />
                            <span class="ss-badge">View SS</span>
                          </div>
                        } @else {
                          <span class="no-ss-tag">No SS</span>
                        }
                      </td>
                      <td>
                        <select
                          class="status-select"
                          [class.status-pending]="pay.status === 'Pending'"
                          [class.status-complete]="pay.status === 'Complete'"
                          [class.status-cancel]="pay.status === 'Cancel'"
                          [ngModel]="pay.status || 'Pending'"
                          (ngModelChange)="onUpdateStatus(pay.id, $event)"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Complete">Complete</option>
                          <option value="Cancel">Cancel</option>
                        </select>
                      </td>
                      <td class="text-right">
                        <div class="action-buttons">
                          <button class="btn btn-secondary btn-sm" (click)="viewReceipt.emit(pay)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                            View Receipt
                          </button>
                          <button class="btn btn-danger-outline btn-sm btn-icon" (click)="onDeletePayment(pay.id)" title="Delete Payment">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </div>

    <!-- Full-screen Screenshot Lightbox Modal -->
    @if (activeScreenshotUrl()) {
      <div class="ss-modal-overlay" (click)="activeScreenshotUrl.set(null)">
        <div class="ss-modal-content" (click)="$event.stopPropagation()">
          <div class="ss-modal-header">
            <h3>Payment Proof Screenshot</h3>
            <button class="modal-close" (click)="activeScreenshotUrl.set(null)">&times;</button>
          </div>
          <div class="ss-modal-body">
            <img [src]="activeScreenshotUrl()" alt="Payment Screenshot" class="full-ss-img" />
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .customer-detail-page {
      padding-bottom: 3rem;
      animation: fadeIn 0.25s ease-out;
    }

    .top-nav-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .top-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .customer-hero-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.75rem;
      margin-bottom: 1.5rem;
    }

    .hero-main {
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;
    }

    .avatar-xl {
      width: 64px;
      height: 64px;
      border-radius: var(--radius-md);
      color: #fff;
      font-weight: 800;
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .hero-details {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .hero-name {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--text-main);
      line-height: 1.2;
    }

    .hero-company {
      font-size: 0.9375rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
    }

    .contact-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border-color);
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .financial-dashboard-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    @media (max-width: 900px) {
      .financial-dashboard-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .fin-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
    }

    .fin-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-dim);
    }

    .fin-val {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-main);
      margin-top: 0.25rem;
    }

    .text-success { color: #34d399; }
    .text-warning { color: #fbbf24; }
    .text-date { font-size: 1.25rem; color: #818cf8; font-weight: 700; }

    .fin-sub {
      font-size: 0.75rem;
      color: var(--text-dim);
      margin-top: 0.35rem;
    }

    .progress-bar-wrap {
      height: 8px;
      background: var(--bg-input);
      border-radius: 4px;
      overflow: hidden;
      margin-top: 0.6rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #34d399);
      border-radius: 4px;
    }

    .fin-progress-footer {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.5rem;
      font-weight: 600;
    }

    /* Payment History Table Panel */
    .payment-history-panel {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }

    .panel-title {
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .panel-sub {
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .tx-badge {
      font-size: 0.75rem;
      font-weight: 700;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      padding: 0.3rem 0.8rem;
      border-radius: var(--radius-full);
      border: 1px solid rgba(99, 102, 241, 0.3);
    }

    .table-responsive {
      overflow-x: auto;
    }

    .history-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .history-table th {
      background: rgba(15, 23, 42, 0.5);
      color: var(--text-muted);
      font-weight: 700;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.875rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .history-table td {
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-main);
      vertical-align: middle;
    }

    .date-cell {
      font-weight: 600;
      white-space: nowrap;
    }

    .method-badge {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-color);
      padding: 0.25rem 0.6rem;
      border-radius: 4px;
      font-size: 0.775rem;
      font-weight: 600;
    }

    .ref-code {
      font-family: monospace;
      font-size: 0.8125rem;
      background: rgba(15, 23, 42, 0.6);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      color: #cbd5e1;
    }

    .notes-cell {
      color: var(--text-muted);
      max-width: 250px;
    }

    .amount-cell {
      font-weight: 800;
      font-size: 0.95rem;
    }

    .text-right { text-align: right; }

    .action-buttons {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .empty-payments-state {
      text-align: center;
      padding: 3.5rem 1.5rem;
      background: rgba(15, 23, 42, 0.4);
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-md);
    }

    .empty-payment-icon {
      color: var(--text-dim);
      margin-bottom: 0.75rem;
    }

    .empty-payments-state h4 {
      font-size: 1.15rem;
      font-weight: 700;
    }

    .status-select {
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 0.35rem 0.6rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      outline: none;
      transition: all 0.15s ease;
    }

    .status-select.status-pending {
      border-color: rgba(251, 191, 36, 0.5);
      color: #fbbf24;
      background: rgba(251, 191, 36, 0.15);
    }

    .status-select.status-complete {
      border-color: rgba(52, 211, 153, 0.5);
      color: #34d399;
      background: rgba(52, 211, 153, 0.15);
    }

    .status-select.status-cancel {
      border-color: rgba(239, 68, 68, 0.5);
      color: #fca5a5;
      background: rgba(239, 68, 68, 0.15);
    }

    .mt-3 { margin-top: 1rem; }

    .ss-table-cell {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.3);
      padding: 0.2rem 0.45rem;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: rgba(99, 102, 241, 0.25);
        border-color: #818cf8;
      }
    }

    .ss-thumb {
      width: 26px;
      height: 26px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid var(--border-color);
    }

    .ss-badge {
      font-size: 0.725rem;
      font-weight: 700;
      color: #818cf8;
    }

    .no-ss-tag {
      font-size: 0.725rem;
      color: var(--text-dim);
      font-style: italic;
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

      .modal-close {
        background: transparent;
        border: none;
        color: var(--text-muted);
        font-size: 1.5rem;
        cursor: pointer;
        line-height: 1;
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
export class CustomerDetailComponent {
  private customerService = inject(CustomerService);

  customer = input<Customer | undefined>();
  back = output<void>();
  openAddPaymentModal = output<void>();
  viewReceipt = output<Payment>();
  customerDeleted = output<void>();
  activeScreenshotUrl = signal<string | null>(null);

  readonly customerPayments = computed(() => {
    const cust = this.customer();
    if (!cust) return [];
    return this.customerService.getPaymentsByCustomerId(cust.id);
  });

  getInitials(name: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getProgressPercentage(cust: Customer): number {
    if (!cust.totalBilled || cust.totalBilled <= 0) return 100;
    return Math.min(100, (cust.totalPaid / cust.totalBilled) * 100);
  }

  getStatusBadgeClass(cust: Customer): string {
    if (cust.balanceDue === 0) return 'badge-success';
    if (cust.totalPaid > 0) return 'badge-warning';
    return 'badge-danger';
  }

  getStatusBadgeText(cust: Customer): string {
    if (cust.balanceDue === 0) return 'PAID';
    if (cust.totalPaid > 0) return 'PARTIAL';
    return 'UNPAID';
  }

  onUpdateStatus(paymentId: string, status: PaymentStatus): void {
    this.customerService.updatePaymentStatus(paymentId, status);
  }

  onDeletePayment(paymentId: string): void {
    if (confirm('Are you sure you want to delete this payment transaction? Customer balance will be recalculated.')) {
      this.customerService.deletePayment(paymentId);
    }
  }

  onDeleteCustomer(): void {
    const cust = this.customer();
    if (!cust) return;
    if (confirm(`Are you sure you want to delete customer "${cust.name}" and all associated payment history?`)) {
      this.customerService.deleteCustomer(cust.id);
      this.customerDeleted.emit();
      this.back.emit();
    }
  }
}
