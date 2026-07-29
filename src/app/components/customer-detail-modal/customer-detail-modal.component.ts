import { Component, inject, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../services/customer.service';
import { Customer, Payment } from '../../models/customer.model';

@Component({
  selector: 'app-customer-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal-content modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="customer-title-block">
            <div class="avatar-lg" [style.background-color]="customer()?.avatarColor || '#4f46e5'">
              {{ getInitials(customer()?.name || '') }}
            </div>
            <div>
              <h2 class="modal-title">{{ customer()?.name }}</h2>
              <div class="subtitle-info">
                <span>{{ customer()?.company }}</span> &bull; 
                <span>{{ customer()?.email }}</span> &bull; 
                <span>{{ customer()?.phone }}</span>
              </div>
            </div>
          </div>
          <button class="modal-close" (click)="onClose()">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Summary Metric Cards -->
          @if (customer(); as cust) {
            <div class="detail-stats-grid">
              <div class="d-card">
                <span class="d-label">Total Billed</span>
                <span class="d-value">\${{ cust.totalBilled | number:'1.0-2' }}</span>
              </div>
              <div class="d-card">
                <span class="d-label">Total Paid</span>
                <span class="d-value text-success">\${{ cust.totalPaid | number:'1.0-2' }}</span>
              </div>
              <div class="d-card">
                <span class="d-label">Balance Due</span>
                <span class="d-value text-warning">\${{ cust.balanceDue | number:'1.0-2' }}</span>
              </div>
              <div class="d-card">
                <span class="d-label">Payment Progress</span>
                <div class="progress-bar-wrap">
                  <div class="progress-fill" [style.width.%]="getProgressPercentage(cust)"></div>
                </div>
                <span class="progress-text">{{ getProgressPercentage(cust) | number:'1.0-0' }}% Paid</span>
              </div>
            </div>

            <!-- Customer Details Info Strip -->
            <div class="info-strip">
              <div class="strip-item">
                <span class="strip-label">Billing Address:</span>
                <span class="strip-val">{{ cust.address }}</span>
              </div>
              <div class="strip-item">
                <span class="strip-label">Customer Since:</span>
                <span class="strip-val">{{ cust.createdAt }}</span>
              </div>
            </div>
          }

          <!-- Payment History Section -->
          <div class="payments-section-header">
            <div class="section-title-group">
              <h3 class="section-title">Payment History</h3>
              <span class="count-badge">{{ customerPayments().length }} Transaction(s)</span>
            </div>
            <button class="btn btn-success btn-sm" (click)="openAddPaymentModal.emit()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="18" y1="12" x2="6" y2="12"></line>
              </svg>
              Record Payment
            </button>
          </div>

          @if (customerPayments().length === 0) {
            <div class="empty-payments-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p>No payment transactions recorded yet for this customer.</p>
              <button class="btn btn-success btn-sm mt-2" (click)="openAddPaymentModal.emit()">
                Log First Payment
              </button>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Payment Method</th>
                    <th>Reference #</th>
                    <th>Notes</th>
                    <th>Amount</th>
                    <th>Screenshot</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (pay of customerPayments(); track pay.id) {
                    <tr>
                      <td class="font-medium">{{ pay.paymentDate }}</td>
                      <td>
                        <span class="method-tag">{{ pay.paymentMethod }}</span>
                      </td>
                      <td><code>{{ pay.referenceNumber }}</code></td>
                      <td class="notes-col">{{ pay.notes || '-' }}</td>
                      <td class="amount-col text-success">\${{ pay.amount | number:'1.2-2' }}</td>
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
                        <div class="action-buttons">
                          <button class="btn btn-secondary btn-sm btn-icon" (click)="viewReceipt.emit(pay)" title="View & Print Receipt">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
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

        <div class="modal-footer justify-between">
          <button class="btn btn-danger-outline btn-sm" (click)="onDeleteCustomer()">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Delete Customer
          </button>
          <button class="btn btn-secondary" (click)="onClose()">Close</button>
        </div>
      </div>
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
    .customer-title-block {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .avatar-lg {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      color: #fff;
      font-weight: 700;
      font-size: 1.15rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .subtitle-info {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
    }

    .detail-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    @media (max-width: 768px) {
      .detail-stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .detail-stats-grid {
        grid-template-columns: 1fr !important;
      }

      .info-strip {
        flex-direction: column;
        gap: 0.5rem;
      }

      .customer-title-block {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .payments-section-header {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
      }
    }

    .d-card {
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem;
      display: flex;
      flex-direction: column;
    }

    .d-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .d-value {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-main);
      margin-top: 0.25rem;
    }

    .text-success { color: #34d399; }
    .text-warning { color: #fbbf24; }

    .progress-bar-wrap {
      height: 8px;
      background: var(--bg-input);
      border-radius: 4px;
      overflow: hidden;
      margin-top: 0.5rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #34d399);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 600;
      margin-top: 0.25rem;
    }

    .info-strip {
      background: rgba(255, 255, 255, 0.03);
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.875rem 1.25rem;
      display: flex;
      gap: 2rem;
      margin-bottom: 1.5rem;
    }

    .strip-item {
      font-size: 0.8125rem;
    }

    .strip-label {
      color: var(--text-dim);
      margin-right: 0.35rem;
    }

    .strip-val {
      color: var(--text-main);
      font-weight: 500;
    }

    .payments-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .section-title-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .section-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .count-badge {
      font-size: 0.75rem;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-muted);
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-full);
    }

    .empty-payments-state {
      text-align: center;
      padding: 2.5rem 1rem;
      background: rgba(15, 23, 42, 0.4);
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-md);
      color: var(--text-dim);
    }

    .empty-payments-state p {
      margin-top: 0.75rem;
      font-size: 0.975rem;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .custom-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .custom-table th {
      background: rgba(15, 23, 42, 0.6);
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .custom-table td {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-main);
    }

    .method-tag {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-color);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.775rem;
      font-weight: 500;
    }

    .notes-col {
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--text-muted);
    }

    .amount-col {
      font-weight: 700;
    }

    .action-buttons {
      display: flex;
      gap: 0.35rem;
    }

    .justify-between {
      justify-content: space-between;
    }

    .mt-2 { margin-top: 0.5rem; }
    .font-medium { font-weight: 500; }

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
export class CustomerDetailModalComponent {
  private customerService = inject(CustomerService);

  customer = input<Customer | undefined>();
  close = output<void>();
  openAddPaymentModal = output<void>();
  viewReceipt = output<Payment>();
  customerDeleted = output<void>();
  activeScreenshotUrl = signal<string | null>(null);

  readonly customerPayments = computed(() => {
    const cust = this.customer();
    if (!cust) return [];
    return this.customerService.getPaymentsByCustomerId(cust.id);
  });

  onClose(): void {
    this.close.emit();
  }

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
      this.onClose();
    }
  }
}
