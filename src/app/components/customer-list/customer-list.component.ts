import { Component, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer.model';

type FilterTab = 'all' | 'pending' | 'complete' | 'cancel';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="customer-list-container">
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
            placeholder="Search customers by name, company, email..."
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
            All Customers ({{ allCustomersCount() }})
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

      <!-- Customer Cards / Grid -->
      @if (filteredCustomers().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
          </div>
          <h3>No Customers Found</h3>
          <p>No customer records match your current search or filter criteria.</p>
          @if (searchQuery()) {
            <button class="btn btn-secondary btn-sm mt-3" (click)="searchQuery.set('')">Clear Search Filter</button>
          } @else {
            <button class="btn btn-primary btn-sm mt-3" (click)="openAddCustomerModal.emit()">
              Add Your First Customer
            </button>
          }
        </div>
      } @else {
        <div class="customer-grid">
          @for (cust of filteredCustomers(); track cust.id) {
            <div class="customer-card" (click)="selectCustomer.emit(cust)">
              <!-- Card Header -->
              <div class="card-header">
                <div class="customer-identity">
                  <div class="avatar" [style.background-color]="cust.avatarColor || '#4f46e5'">
                    {{ getInitials(cust.name) }}
                  </div>
                  <div class="cust-info">
                    <h3 class="cust-name">{{ cust.name }}</h3>
                    <span class="cust-company">{{ cust.company }}</span>
                  </div>
                </div>
                <span class="badge" [class]="getStatusBadgeClass(cust)">
                  {{ getStatusBadgeText(cust) }}
                </span>
              </div>

              <!-- Contact Information -->
              <div class="contact-details">
                <div class="detail-row">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <span>{{ cust.email }}</span>
                </div>
                <div class="detail-row">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <span>{{ cust.phone }}</span>
                </div>
              </div>

              <!-- Payments Summary -->
              <div class="billing-summary">
                <div class="bill-col">
                  <span class="bill-lbl">Total Payments Collected</span>
                  <span class="bill-val text-success">\${{ cust.totalPaid | number:'1.2-2' }}</span>
                </div>
              </div>

              <!-- Payment Progress Bar -->
              <div class="progress-bar-container">
                <div class="progress-bar-fill" [style.width.%]="getPaidPercentage(cust)"></div>
              </div>

              <!-- Card Footer Action Buttons -->
              <div class="card-actions" (click)="$event.stopPropagation()">
                <button class="btn btn-secondary btn-sm flex-1" (click)="selectCustomer.emit(cust)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  View Payments
                </button>

                <button class="btn btn-success btn-sm flex-1" (click)="recordPaymentFor.emit(cust)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  Add Payment
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .customer-list-container {
      padding-bottom: 3rem;
    }

    .control-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 280px;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      color: var(--text-dim);
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 2.5rem;
      font-family: var(--font-family);
      font-size: 0.9rem;
      background-color: var(--bg-card);
      color: var(--text-main);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-full);
      outline: none;
      transition: var(--transition);
    }

    .search-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }

    .clear-search {
      position: absolute;
      right: 0.875rem;
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
      padding: 0.25rem;
      border-radius: var(--radius-full);
      gap: 0.25rem;
      overflow-x: auto;
      max-width: 100%;
      -webkit-overflow-scrolling: touch;
    }

    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 0.5rem 1rem;
      font-size: 0.8125rem;
      font-weight: 600;
      border-radius: var(--radius-full);
      cursor: pointer;
      transition: var(--transition);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .tab-btn.active {
      background: var(--primary);
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
    }

    @media (max-width: 768px) {
      .search-box {
        min-width: 100%;
      }

      .control-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .tab-filters {
        width: 100%;
      }

      .tab-btn {
        padding: 0.4rem 0.75rem;
        font-size: 0.75rem;
      }

      .customer-grid {
        grid-template-columns: 1fr !important;
      }
    }

    /* Customer Cards Grid */
    .customer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .customer-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      transition: var(--transition);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }

    .customer-card:hover {
      transform: translateY(-3px);
      border-color: var(--border-highlight);
      box-shadow: var(--shadow-md);
      background-color: #243347;
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .customer-identity {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .avatar {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      color: #ffffff;
      font-weight: 700;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .cust-info {
      display: flex;
      flex-direction: column;
    }

    .cust-name {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.2;
    }

    .cust-company {
      font-size: 0.775rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
    }

    .contact-details {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      padding-bottom: 1rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    .detail-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .billing-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      margin-bottom: 0.875rem;
      background: rgba(15, 23, 42, 0.4);
      padding: 0.75rem;
      border-radius: var(--radius-md);
    }

    .bill-col {
      display: flex;
      flex-direction: column;
    }

    .bill-lbl {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--text-dim);
      text-transform: uppercase;
    }

    .bill-val {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .text-success { color: #34d399; }
    .text-warning { color: #fbbf24; }

    .progress-bar-container {
      height: 4px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 1.25rem;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #34d399);
      border-radius: 2px;
    }

    .card-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: auto;
    }

    .flex-1 { flex: 1; }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 4rem 1.5rem;
      background: var(--bg-card);
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-lg);
      margin-top: 1rem;
    }

    .empty-icon {
      color: var(--text-dim);
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .mt-3 { margin-top: 1rem; }
  `]
})
export class CustomerListComponent {
  private customerService = inject(CustomerService);

  selectCustomer = output<Customer>();
  recordPaymentFor = output<Customer>();
  openAddCustomerModal = output<void>();

  searchQuery = signal<string>('');
  activeTab = signal<FilterTab>('all');

  private allCustomers = this.customerService.customers;

  getCustomerStatus(cust: Customer): 'Pending' | 'Complete' | 'Cancel' {
    const payments = this.customerService.getPaymentsByCustomerId(cust.id);
    if (payments.length === 0) return 'Pending';

    // If any payment is pending review, prioritize Pending
    if (payments.some(p => p.status === 'Pending')) {
      return 'Pending';
    }

    const latest = payments[0];
    if (latest.status === 'Cancel') return 'Cancel';
    return latest.status === 'Complete' ? 'Complete' : 'Pending';
  }

  allCustomersCount = computed(() => this.allCustomers().length);
  pendingCount = computed(() => this.allCustomers().filter(c => this.getCustomerStatus(c) === 'Pending').length);
  completeCount = computed(() => this.allCustomers().filter(c => this.getCustomerStatus(c) === 'Complete').length);
  cancelCount = computed(() => this.allCustomers().filter(c => this.getCustomerStatus(c) === 'Cancel').length);

  filteredCustomers = computed(() => {
    let list = this.allCustomers();
    const query = this.searchQuery().toLowerCase().trim();
    const tab = this.activeTab();

    if (query) {
      list = list.filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.company.toLowerCase().includes(query) ||
          c.phone.toLowerCase().includes(query)
      );
    }

    if (tab === 'pending') {
      list = list.filter(c => this.getCustomerStatus(c) === 'Pending');
    } else if (tab === 'complete') {
      list = list.filter(c => this.getCustomerStatus(c) === 'Complete');
    } else if (tab === 'cancel') {
      list = list.filter(c => this.getCustomerStatus(c) === 'Cancel');
    }

    return list;
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

  getPaidPercentage(cust: Customer): number {
    if (!cust.totalBilled || cust.totalBilled <= 0) return 100;
    return Math.min(100, (cust.totalPaid / cust.totalBilled) * 100);
  }

  getStatusBadgeClass(cust: Customer): string {
    const status = this.getCustomerStatus(cust);
    if (status === 'Complete') return 'badge-success';
    if (status === 'Pending') return 'badge-warning';
    return 'badge-danger';
  }

  getStatusBadgeText(cust: Customer): string {
    return this.getCustomerStatus(cust).toUpperCase();
  }
}
