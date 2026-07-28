import { Component, inject, computed, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { CustomerService } from '../../services/customer.service';
import { Payment } from '../../models/customer.model';

@Component({
  selector: 'app-customer-portal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="customer-portal-container">
      @if (customer(); as cust) {
        <!-- Welcome Hero Banner -->
        <div class="portal-hero">
          <div class="hero-left">
            <div class="avatar-lg" [style.background-color]="cust.avatarColor || '#4f46e5'">
              {{ getInitials(cust.name) }}
            </div>
            <div>
              <span class="welcome-tag">CUSTOMER PORTAL</span>
              <h1 class="welcome-title">Welcome back, {{ cust.name }}</h1>
              <p class="welcome-sub">{{ cust.company }} &bull; {{ cust.email }}</p>
            </div>
          </div>
          <button class="btn btn-success" (click)="openAddPayment.emit()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="18" y1="12" x2="6" y2="12"></line>
            </svg>
            Make / Log Payment
          </button>
        </div>

        <!-- Personal Payments Summary Cards -->
        <div class="stats-grid">
          <div class="stat-box">
            <span class="sb-label">Total Payments Made</span>
            <div class="sb-val text-success">\${{ cust.totalPaid | number:'1.2-2' }}</div>
            <span class="sb-hint">Total sum of all cleared payments</span>
          </div>

          <div class="stat-box">
            <span class="sb-label">Total Transactions</span>
            <div class="sb-val">{{ payments().length }}</div>
            <span class="sb-hint">Recorded payment receipts</span>
          </div>

          <div class="stat-box">
            <span class="sb-label">Latest Payment Date</span>
            <div class="sb-val text-date">{{ payments().length > 0 ? payments()[0].paymentDate : 'N/A' }}</div>
            <span class="sb-hint">Most recent payment date</span>
          </div>

          <div class="stat-box qr-stat-box">
            <span class="sb-label">Scan QR Code to Pay</span>
            <div class="qr-card-content">
              <img src="/Image.png" alt="Payment QR Code" class="qr-card-thumb" (click)="showQrModal.set(true)" title="Click to Expand QR" />
              <div class="qr-card-actions">
                <button class="btn btn-primary btn-xs" (click)="showQrModal.set(true)">
                  🔍 View QR
                </button>
                <a href="/Image.png" download="Payment_QR_Code.png" class="btn btn-success btn-xs">
                  ⬇️ Download
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Personal Payment History Section -->
        <div class="history-card">
          <div class="history-header">
            <div>
              <h2 class="section-title">Your Payment History</h2>
              <p class="section-sub">Showing only your transaction logs and receipts</p>
            </div>
            <span class="badge badge-neutral">{{ payments().length }} Payment(s)</span>
          </div>

          @if (payments().length === 0) {
            <div class="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p>You have no payments logged yet.</p>
              <button class="btn btn-success btn-sm mt-3" (click)="openAddPayment.emit()">
                Log Payment Now
              </button>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="portal-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Payment Method</th>
                    <th>Reference / Txn ID</th>
                    <th>Notes</th>
                    <th>Amount Paid</th>
                    <th>Verify</th>
                    <th class="text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  @for (pay of payments(); track pay.id) {
                    <tr>
                      <td class="font-bold">{{ pay.paymentDate }}</td>
                      <td>
                        <span class="method-tag">{{ pay.paymentMethod }}</span>
                      </td>
                      <td><code>{{ pay.referenceNumber }}</code></td>
                      <td class="notes-cell">{{ pay.notes || '-' }}</td>
                      <td class="amount-cell text-success">\${{ pay.amount | number:'1.2-2' }}</td>
                      <td>
                        <span
                          class="status-pill"
                          [class.pill-pending]="pay.status === 'Pending'"
                          [class.pill-complete]="pay.status === 'Complete'"
                          [class.pill-cancel]="pay.status === 'Cancel'"
                        >
                          {{ pay.status || 'Pending' }}
                        </span>
                      </td>
                      <td class="text-right">
                        <button class="btn btn-secondary btn-sm" (click)="viewReceipt.emit(pay)">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                          </svg>
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- Payment QR Code Modal Popup -->
        @if (showQrModal()) {
          <div class="qr-modal-backdrop" (click)="showQrModal.set(false)">
            <div class="qr-modal-card" (click)="$event.stopPropagation()">
              <div class="qr-modal-header">
                <div>
                  <h3 class="qr-modal-title">Payment QR Code</h3>
                  <p class="qr-modal-sub">Scan using any UPI or Mobile Banking App</p>
                </div>
                <button class="qr-modal-close" (click)="showQrModal.set(false)">&times;</button>
              </div>

              <div class="qr-modal-body">
                <div class="qr-img-wrapper">
                  <img src="/Image.png" alt="Payment QR Code" class="qr-modal-img" />
                </div>
                <p class="qr-instruction">
                  Scan this QR code using GPay, PhonePe, Paytm, BHIM, or any UPI app to complete your payment, then click <strong>Log Payment Transaction</strong> to record it.
                </p>
              </div>

              <div class="qr-modal-footer">
                <a href="/Image.png" download="Payment_QR_Code.png" class="btn btn-outline-success">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Download QR Code
                </a>
                <button class="btn btn-success" (click)="showQrModal.set(false); openAddPayment.emit()">
                  Log Payment Transaction
                </button>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .customer-portal-container {
      padding-bottom: 3rem;
      animation: fadeIn 0.25s ease-out;
    }

    .portal-hero {
      background: var(--bg-card);
      border: 1px solid var(--border-highlight);
      border-radius: var(--radius-lg);
      padding: 1.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .hero-left {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .avatar-lg {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-md);
      color: #fff;
      font-weight: 800;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .welcome-tag {
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #818cf8;
      text-transform: uppercase;
    }

    .welcome-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-main);
      line-height: 1.2;
    }

    .welcome-sub {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
      margin-bottom: 1.75rem;
    }

    @media (max-width: 900px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .stat-box {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
    }

    .sb-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-dim);
    }

    .sb-val {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-main);
      margin-top: 0.25rem;
    }

    .text-success { color: #34d399; }
    .text-warning { color: #fbbf24; }
    .text-date { font-size: 1.25rem; color: #818cf8; font-weight: 700; }

    .sb-hint {
      font-size: 0.75rem;
      color: var(--text-dim);
      margin-top: 0.35rem;
    }

    .badge-row {
      margin-top: 0.35rem;
      margin-bottom: 0.4rem;
    }

    .progress-bar-wrap {
      height: 6px;
      background: var(--bg-input);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #34d399);
    }

    .history-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
    }

    .history-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }

    .section-title {
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .section-sub {
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .table-responsive {
      overflow-x: auto;
    }

    .portal-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .portal-table th {
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

    .portal-table td {
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-main);
    }

    .method-tag {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-color);
      padding: 0.25rem 0.6rem;
      border-radius: 4px;
      font-size: 0.775rem;
      font-weight: 600;
    }

    .notes-cell {
      color: var(--text-muted);
      max-width: 250px;
    }

    .amount-cell {
      font-weight: 800;
      font-size: 0.95rem;
    }

    .status-pill {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      border-radius: 4px;
      font-size: 0.775rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .status-pill.pill-pending {
      background: rgba(251, 191, 36, 0.15);
      border: 1px solid rgba(251, 191, 36, 0.4);
      color: #fbbf24;
    }

    .status-pill.pill-complete {
      background: rgba(52, 211, 153, 0.15);
      border: 1px solid rgba(52, 211, 153, 0.4);
      color: #34d399;
    }

    .status-pill.pill-cancel {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
    }

    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      background: rgba(15, 23, 42, 0.4);
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-md);
      color: var(--text-dim);
    }

    .empty-state p {
      margin-top: 0.75rem;
      font-size: 0.95rem;
    }

    .qr-stat-box {
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9));
      border: 1px solid rgba(99, 102, 241, 0.3);
    }

    .qr-card-content {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      margin-top: 0.5rem;
    }

    .qr-card-thumb {
      width: 48px;
      height: 48px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: #ffffff;
      padding: 3px;
      cursor: pointer;
      transition: transform 0.15s ease;
    }

    .qr-card-thumb:hover {
      transform: scale(1.08);
    }

    .qr-card-actions {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .btn-xs {
      padding: 0.3rem 0.55rem;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: 4px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
    }

    .btn-outline-primary {
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: #818cf8;

      &:hover {
        background: rgba(99, 102, 241, 0.3);
        color: #ffffff;
      }
    }

    .qr-modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(10, 15, 30, 0.85);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease-out;
    }

    .qr-modal-card {
      background: var(--bg-card);
      border: 1px solid var(--border-highlight);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 520px;
      overflow: hidden;
      box-shadow: var(--shadow-modal);
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .qr-modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.02);
    }

    .qr-modal-title {
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 0;
    }

    .qr-modal-sub {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.2rem;
    }

    .qr-modal-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.5rem;
      cursor: pointer;
      line-height: 1;
      padding: 0.2rem;
    }

    .qr-modal-body {
      padding: 1.75rem 1.5rem;
      text-align: center;
    }

    .qr-img-wrapper {
      background: #ffffff;
      padding: 1.25rem;
      border-radius: 16px;
      display: inline-block;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      max-width: 100%;
    }

    .qr-modal-img {
      width: 340px;
      height: 420px;
      max-width: 100%;
      object-fit: contain;
      display: block;
    }

    .qr-instruction {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 1rem;
      line-height: 1.4;
    }

    .qr-modal-footer {
      padding: 1rem 1.5rem;
      background: rgba(15, 23, 42, 0.4);
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .btn-outline-success {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
      text-decoration: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.6rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      font-weight: 700;
      transition: all 0.15s ease;

      &:hover {
        background: rgba(16, 185, 129, 0.3);
        color: #ffffff;
      }
    }

    .mt-3 { margin-top: 1rem; }
  `]
})
export class CustomerPortalComponent {
  private authService = inject(AuthService);
  private customerService = inject(CustomerService);

  openAddPayment = output<void>();
  viewReceipt = output<Payment>();
  showQrModal = signal<boolean>(false);

  // Current logged in customer profile
  readonly customer = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return undefined;

    // 1. Find by customerId
    if (user.customerId) {
      const found = this.customerService.getCustomerById(user.customerId);
      if (found) return found;
    }

    // 2. Find by email
    const all = this.customerService.customers();
    return all.find(c => c.email.toLowerCase() === user.email.toLowerCase());
  });

  // Only payments for THIS customer
  readonly payments = computed(() => {
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

  getProgressPercentage(cust: any): number {
    if (!cust.totalBilled || cust.totalBilled <= 0) return 100;
    return Math.min(100, (cust.totalPaid / cust.totalBilled) * 100);
  }

  getStatusBadgeClass(cust: any): string {
    if (cust.balanceDue === 0) return 'badge-success';
    if (cust.totalPaid > 0) return 'badge-warning';
    return 'badge-danger';
  }

  getStatusBadgeText(cust: any): string {
    if (cust.balanceDue === 0) return 'PAID';
    if (cust.totalPaid > 0) return 'PARTIAL';
    return 'UNPAID';
  }
}
