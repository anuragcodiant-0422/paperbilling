import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EnquiryService } from '../../services/enquiry.service';
import { Enquiry, EnquiryStatus } from '../../models/customer.model';

@Component({
  selector: 'app-enquiries-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="enquiries-container">
      <!-- Top Action & Search Bar -->
      <div class="filter-actions-row">
        <div class="search-box">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            class="form-control search-input"
            placeholder="Search enquiries by name, email, phone, subject..."
            [(ngModel)]="searchQuery"
          />
          @if (searchQuery()) {
            <button class="clear-search-btn" (click)="searchQuery.set('')">&times;</button>
          }
        </div>

        <div class="filter-controls">
          <div class="select-group">
            <label class="filter-label">Status:</label>
            <select class="form-control select-filter" [(ngModel)]="statusFilter">
              <option value="ALL">All Enquiries</option>
              <option value="New">New Enquiries</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <button class="btn btn-secondary btn-refresh" (click)="enquiryService.loadEnquiries()" title="Refresh Enquiries">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <!-- Enquiries Data Table / Cards -->
      <div class="table-card">
        @if (filteredEnquiries().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">📩</div>
            <h4>No Enquiries Found</h4>
            <p>No customer contact form submissions match your filter criteria.</p>
          </div>
        } @else {
          <div class="responsive-table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Customer / Sender</th>
                  <th>Contact Info</th>
                  <th>Subject</th>
                  <th>Message Preview</th>
                  <th>Status</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (enq of filteredEnquiries(); track enq.id) {
                  <tr [class.row-new]="enq.status === 'New'">
                    <td class="whitespace-nowrap date-cell">
                      <span class="d-date">{{ formatDate(enq.createdAt) }}</span>
                      <span class="d-time">{{ formatTime(enq.createdAt) }}</span>
                    </td>
                    <td>
                      <div class="sender-name-wrap">
                        <span class="sender-name">{{ enq.name }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="contact-details">
                        <span class="contact-email">✉️ {{ enq.email }}</span>
                        <span class="contact-phone">📞 {{ enq.phone }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="badge-subject">{{ enq.subject }}</span>
                    </td>
                    <td class="msg-preview-cell" (click)="viewDetail(enq)">
                      <div class="msg-text-clamp">{{ enq.message }}</div>
                    </td>
                    <td>
                      <span class="status-badge" [class.badge-new]="enq.status === 'New'" [class.badge-resolved]="enq.status === 'Resolved'">
                        {{ enq.status }}
                      </span>
                    </td>
                    <td class="text-right action-cells">
                      <div class="action-btn-group">
                        <button class="btn btn-outline-info btn-xs" (click)="viewDetail(enq)">View Details</button>
                        @if (enq.status === 'New') {
                          <button class="btn btn-outline-success btn-xs" (click)="toggleResolved(enq)">Mark Resolved</button>
                        } @else {
                          <button class="btn btn-outline-warning btn-xs" (click)="toggleResolved(enq)">Reopen</button>
                        }
                        <button class="btn btn-outline-danger btn-xs" (click)="deleteEnquiry(enq.id)">Delete</button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Enquiry Details Lightbox Modal Popup -->
      @if (selectedEnquiry(); as target) {
        <div class="modal-overlay" (click)="selectedEnquiry.set(undefined)">
          <div class="modal-content enq-detail-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3 class="modal-title">Enquiry Details</h3>
                <p class="header-subtitle">Submitted on {{ formatDate(target.createdAt) }} at {{ formatTime(target.createdAt) }}</p>
              </div>
              <button class="modal-close" (click)="selectedEnquiry.set(undefined)">&times;</button>
            </div>

            <div class="modal-body enq-detail-body">
              <div class="detail-grid">
                <div class="detail-block">
                  <span class="d-label">Sender Name</span>
                  <span class="d-val text-main">{{ target.name }}</span>
                </div>
                <div class="detail-block">
                  <span class="d-label">Email Address</span>
                  <a [href]="'mailto:' + target.email" class="d-val text-accent">✉️ {{ target.email }}</a>
                </div>
                <div class="detail-block">
                  <span class="d-label">Phone Number</span>
                  <a [href]="'tel:' + target.phone" class="d-val text-accent">📞 {{ target.phone }}</a>
                </div>
                <div class="detail-block">
                  <span class="d-label">Subject</span>
                  <span class="badge-subject lg">{{ target.subject }}</span>
                </div>
              </div>

              <div class="msg-full-box">
                <span class="d-label">Full Message</span>
                <p class="full-msg-content">{{ target.message }}</p>
              </div>
            </div>

            <div class="modal-footer">
              @if (target.status === 'New') {
                <button class="btn btn-success" (click)="toggleResolved(target)">Mark as Resolved</button>
              } @else {
                <button class="btn btn-warning" (click)="toggleResolved(target)">Reopen Enquiry</button>
              }
              <button class="btn btn-secondary" (click)="selectedEnquiry.set(undefined)">Close</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .enquiries-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .filter-actions-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 280px;
    }

    .search-icon {
      position: absolute;
      left: 0.85rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
    }

    .search-input {
      padding-left: 2.35rem !important;
      padding-right: 2rem !important;
    }

    .clear-search-btn {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.2rem;
      cursor: pointer;
    }

    .filter-controls {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .select-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .select-filter {
      padding: 0.45rem 0.75rem;
      font-size: 0.825rem;
      border-radius: var(--radius-sm);
    }

    .table-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .responsive-table-wrapper {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.85rem;
    }

    .data-table th {
      background: rgba(15, 23, 42, 0.7);
      padding: 0.85rem 1rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-color);
    }

    .data-table td {
      padding: 0.95rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      vertical-align: middle;
    }

    .data-table tbody tr:hover {
      background: rgba(255, 255, 255, 0.02);
    }

    .row-new {
      background: rgba(99, 102, 241, 0.04);
    }

    .date-cell {
      display: flex;
      flex-direction: column;
    }

    .d-date {
      font-weight: 700;
      color: var(--text-main);
    }

    .d-time {
      font-size: 0.725rem;
      color: var(--text-dim);
    }

    .sender-name {
      font-weight: 800;
      color: var(--text-main);
      font-size: 0.9rem;
    }

    .contact-details {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .contact-email {
      color: #818cf8;
      font-weight: 600;
      font-size: 0.8rem;
    }

    .contact-phone {
      color: var(--text-muted);
      font-size: 0.775rem;
    }

    .badge-subject {
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: #a5b4fc;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;

      &.lg {
        font-size: 0.85rem;
        padding: 0.3rem 0.65rem;
      }
    }

    .msg-preview-cell {
      max-width: 250px;
      cursor: pointer;
    }

    .msg-text-clamp {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      color: var(--text-muted);
      font-size: 0.8rem;
      line-height: 1.35;
    }

    .status-badge {
      padding: 0.25rem 0.6rem;
      border-radius: 20px;
      font-size: 0.725rem;
      font-weight: 800;
      text-transform: uppercase;

      &.badge-new {
        background: rgba(59, 130, 246, 0.15);
        color: #60a5fa;
        border: 1px solid rgba(59, 130, 246, 0.3);
      }

      &.badge-resolved {
        background: rgba(16, 185, 129, 0.15);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.3);
      }
    }

    .action-cells {
      white-space: nowrap;
    }

    .action-btn-group {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.4rem;
    }

    .btn-xs {
      padding: 0.25rem 0.5rem;
      font-size: 0.725rem;
      border-radius: 4px;
      font-weight: 700;
    }

    .btn-outline-info {
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.4);
      color: #60a5fa;
      &:hover { background: rgba(59, 130, 246, 0.25); color: #fff; }
    }

    .btn-outline-success {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
      &:hover { background: rgba(16, 185, 129, 0.25); color: #fff; }
    }

    .btn-outline-warning {
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: #fbbf24;
      &:hover { background: rgba(245, 158, 11, 0.25); color: #fff; }
    }

    .btn-outline-danger {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
      &:hover { background: rgba(239, 68, 68, 0.25); color: #fff; }
    }

    .text-right { text-align: right; }
    .text-accent { color: #818cf8; text-decoration: none; }

    .empty-state {
      padding: 3rem 1.5rem;
      text-align: center;
      color: var(--text-dim);
    }

    .empty-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    /* Detail Modal */
    .enq-detail-card {
      max-width: 580px !important;
      width: 100%;
    }

    .enq-detail-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border-color);
      padding: 1rem;
      border-radius: var(--radius-md);
    }

    .detail-block {
      display: flex;
      flex-direction: column;
    }

    .d-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-dim);
    }

    .d-val {
      font-size: 0.85rem;
      font-weight: 700;
      margin-top: 0.25rem;
    }

    .msg-full-box {
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .full-msg-content {
      font-size: 0.875rem;
      color: var(--text-main);
      white-space: pre-wrap;
      line-height: 1.5;
      margin: 0;
    }

    @media (max-width: 640px) {
      .filter-actions-row {
        flex-direction: column;
        align-items: stretch;
      }

      .search-box {
        width: 100%;
      }

      .filter-controls {
        width: 100%;
        justify-content: space-between;
      }
    }
  `]
})
export class EnquiriesListComponent {
  enquiryService = inject(EnquiryService);

  searchQuery = signal<string>('');
  statusFilter = signal<string>('ALL');
  selectedEnquiry = signal<Enquiry | undefined>(undefined);

  filteredEnquiries = computed<Enquiry[]>(() => {
    const list = this.enquiryService.enquiries();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();

    return list.filter(item => {
      // Status filter
      if (status !== 'ALL' && item.status !== status) {
        return false;
      }

      // Query filter
      if (!query) return true;

      return (
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        item.phone.toLowerCase().includes(query) ||
        item.subject.toLowerCase().includes(query) ||
        item.message.toLowerCase().includes(query)
      );
    });
  });

  viewDetail(enquiry: Enquiry): void {
    this.selectedEnquiry.set(enquiry);
  }

  async toggleResolved(enquiry: Enquiry): Promise<void> {
    const nextStatus: EnquiryStatus = enquiry.status === 'New' ? 'Resolved' : 'New';
    await this.enquiryService.updateStatus(enquiry.id, nextStatus);
    if (this.selectedEnquiry()?.id === enquiry.id) {
      this.selectedEnquiry.set({ ...enquiry, status: nextStatus });
    }
  }

  async deleteEnquiry(id: string): Promise<void> {
    if (confirm('Are you sure you want to delete this customer inquiry?')) {
      await this.enquiryService.deleteEnquiry(id);
      if (this.selectedEnquiry()?.id === id) {
        this.selectedEnquiry.set(undefined);
      }
    }
  }

  formatDate(isoStr: string): string {
    if (!isoStr) return '';
    try {
      return new Date(isoStr).toLocaleDateString();
    } catch (e) {
      return isoStr;
    }
  }

  formatTime(isoStr: string): string {
    if (!isoStr) return '';
    try {
      return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  }
}
