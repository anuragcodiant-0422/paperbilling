import { Component, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../services/customer.service';
import { Customer, Payment, PaymentStatus } from '../../models/customer.model';

type StatusTab = 'all' | 'pending' | 'complete' | 'cancel';

@Component({
  selector: 'app-all-payments-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="all-payments-container">
      <!-- Search & Filter Control Bar -->
      <div class="control-bar">
        <div class="search-box">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            class="search-input"
            placeholder="Search all payments by customer, email, reference, notes..."
            [(ngModel)]="searchQuery"
          />
          @if (searchQuery()) {
            <button class="clear-search" (click)="searchQuery.set('')">&times;</button>
          }
        </div>

        <div class="tab-filters">
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'all'"
            (click)="activeTab.set('all')"
          >
            All Payments ({{ allCount() }})
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'pending'"
            (click)="activeTab.set('pending')"
          >
            Pending ({{ pendingCount() }})
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'complete'"
            (click)="activeTab.set('complete')"
          >
            Complete ({{ completeCount() }})
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'cancel'"
            (click)="activeTab.set('cancel')"
          >
            Cancel ({{ cancelCount() }})
          </button>
        </div>
      </div>

      <!-- Payments Table Card -->
      <div class="table-card">
        <div class="card-header">
          <div>
            <h2 class="section-title">All Customer Payment Records</h2>
            <p class="section-sub">Consolidated transaction history for all registered accounts</p>
          </div>
          <span class="badge badge-neutral">{{ filteredPayments().length }} Payment(s)</span>
        </div>

        @if (filteredPayments().length === 0) {
          <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
            <h3>No Payment Records Found</h3>
            <p>No transactions match your current search or status filter criteria.</p>
            @if (searchQuery()) {
              <button class="btn btn-secondary btn-sm mt-3" (click)="searchQuery.set('')">Clear Search</button>
            }
          </div>
        } @else {
          <div class="table-responsive">
            <table class="global-payments-table">
              <thead>
                <tr>
                  <th>Customer Account</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Ref / Txn ID</th>
                  <th>Notes</th>
                  <th>Amount</th>
                  <th>Verify</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (pay of filteredPayments(); track pay.id) {
                  @let cust = getCustomerForPayment(pay);
                  <tr>
                    <td>
                      <div class="cust-cell" (click)="cust && selectCustomer.emit(cust)" title="Click to view customer details">
                        <div class="avatar-sm" [style.background-color]="cust?.avatarColor || '#4f46e5'">
                          {{ getInitials(cust?.name || 'Customer') }}
                        </div>
                        <div class="cust-cell-info">
                          <span class="cust-cell-name">{{ cust?.name || 'Unknown Customer' }}</span>
                          <span class="cust-cell-email">{{ cust?.email || pay.customerId }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="font-bold date-cell">{{ pay.paymentDate }}</td>
                    <td>
                      <span class="method-tag">{{ pay.paymentMethod }}</span>
                    </td>
                    <td><code>{{ pay.referenceNumber || 'N/A' }}</code></td>
                    <td class="notes-cell">{{ pay.notes || '-' }}</td>
                    <td class="amount-cell text-success">\${{ pay.amount | number:'1.2-2' }}</td>
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
                          Receipt
                        </button>
                        <button class="btn btn-danger-outline btn-icon" (click)="onDeletePayment(pay.id)" title="Delete Payment">
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
    </div>
  `,
  styles: [`
    .all-payments-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .control-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 300px;
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-dim);
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 2.5rem 0.75rem 2.75rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: var(--text-main);
      font-size: 0.9rem;
      outline: none;
      transition: var(--transition);

      &:focus {
        border-color: var(--primary);
        box-shadow: 0 0 0 3px var(--primary-light);
      }
    }

    .clear-search {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.25rem;
      cursor: pointer;
    }

    .tab-filters {
      display: flex;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      padding: 0.35rem;
      border-radius: var(--radius-md);
      gap: 0.35rem;
    }

    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 0.5rem 0.85rem;
      font-size: 0.825rem;
      font-weight: 700;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: var(--transition);

      &:hover {
        color: var(--text-main);
      }

      &.active {
        background: var(--primary);
        color: #ffffff;
      }
    }

    .table-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .card-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .section-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 0;
    }

    .section-sub {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .global-payments-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;

      th {
        padding: 0.85rem 1.25rem;
        background: rgba(15, 23, 42, 0.4);
        color: var(--text-dim);
        font-weight: 700;
        text-transform: uppercase;
        font-size: 0.725rem;
        letter-spacing: 0.05em;
        border-bottom: 1px solid var(--border-color);
      }

      td {
        padding: 1rem 1.25rem;
        border-bottom: 1px solid var(--border-color);
        color: var(--text-main);
        vertical-align: middle;
      }

      tr:last-child td {
        border-bottom: none;
      }

      tr:hover td {
        background: rgba(255, 255, 255, 0.02);
      }
    }

    .cust-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;

      &:hover .cust-cell-name {
        color: var(--primary);
        text-decoration: underline;
      }
    }

    .avatar-sm {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      color: #ffffff;
      font-weight: 800;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .cust-cell-info {
      display: flex;
      flex-direction: column;
    }

    .cust-cell-name {
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.2;
    }

    .cust-cell-email {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .method-tag {
      background: rgba(255, 255, 255, 0.06);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.775rem;
      border: 1px solid var(--border-color);
    }

    code {
      font-family: monospace;
      font-size: 0.8rem;
      color: #818cf8;
      background: rgba(99, 102, 241, 0.1);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
    }

    .notes-cell {
      color: var(--text-muted);
      max-width: 180px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .amount-cell {
      font-weight: 800;
      font-size: 0.95rem;
    }

    .status-select {
      border: 1px solid var(--border-color);
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

    .action-buttons {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 1.5rem;
      color: var(--text-dim);
    }

    .empty-state h3 {
      font-size: 1.2rem;
      font-weight: 700;
      margin: 0.75rem 0 0.25rem;
      color: var(--text-main);
    }

    .empty-state p {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    .text-success { color: #34d399; }
    .mt-3 { margin-top: 1rem; }
  `]
})
export class AllPaymentsListComponent {
  private customerService = inject(CustomerService);

  viewReceipt = output<Payment>();
  selectCustomer = output<Customer>();

  searchQuery = signal<string>('');
  activeTab = signal<StatusTab>('all');

  private allPayments = computed(() => this.customerService.payments());

  getCustomerForPayment(payment: Payment): Customer | undefined {
    return this.customerService.getCustomerById(payment.customerId);
  }

  allCount = computed(() => this.allPayments().length);
  pendingCount = computed(() => this.allPayments().filter(p => p.status === 'Pending').length);
  completeCount = computed(() => this.allPayments().filter(p => p.status === 'Complete' || p.status === ('Completed' as any)).length);
  cancelCount = computed(() => this.allPayments().filter(p => p.status === 'Cancel').length);

  filteredPayments = computed(() => {
    let list = this.allPayments();
    const query = this.searchQuery().toLowerCase().trim();
    const tab = this.activeTab();

    if (query) {
      list = list.filter(p => {
        const cust = this.getCustomerForPayment(p);
        const custName = cust?.name?.toLowerCase() || '';
        const custEmail = cust?.email?.toLowerCase() || '';
        const refNum = (p.referenceNumber || '').toLowerCase();
        const notes = (p.notes || '').toLowerCase();
        const method = (p.paymentMethod || '').toLowerCase();

        return (
          custName.includes(query) ||
          custEmail.includes(query) ||
          refNum.includes(query) ||
          notes.includes(query) ||
          method.includes(query)
        );
      });
    }

    if (tab === 'pending') {
      list = list.filter(p => p.status === 'Pending');
    } else if (tab === 'complete') {
      list = list.filter(p => p.status === 'Complete' || p.status === ('Completed' as any));
    } else if (tab === 'cancel') {
      list = list.filter(p => p.status === 'Cancel');
    }

    return list.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
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

  onUpdateStatus(paymentId: string, status: PaymentStatus): void {
    this.customerService.updatePaymentStatus(paymentId, status);
  }

  onDeletePayment(paymentId: string): void {
    if (confirm('Are you sure you want to delete this payment record? This action will sync to Firebase.')) {
      this.customerService.deletePayment(paymentId);
    }
  }
}
