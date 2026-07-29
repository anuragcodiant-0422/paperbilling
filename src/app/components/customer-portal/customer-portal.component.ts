import { Component, inject, computed, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GooglePayButtonModule } from '@google-pay/button-angular';
import { AuthService } from '../../services/auth.service';
import { CustomerService } from '../../services/customer.service';
import { Payment } from '../../models/customer.model';

@Component({
  selector: 'app-customer-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, GooglePayButtonModule],
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

          <div class="stat-box gpay-stat-box">
            <span class="sb-label">Express Google Pay</span>
            <div class="gpay-card-content">
             
              <button class="btn btn-gpay-app" (click)="openGooglePayApp()">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                  <line x1="12" y1="18" x2="12.01" y2="18"></line>
                </svg>
                Open GPay App 
              </button>
              <span class="gpay-sub">Web checkout or direct mobile app redirect</span>
            </div>
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
            <div class="history-actions">
              <div class="date-range-group">
                <select class="date-preset-select-sm" [ngModel]="datePreset()" (ngModelChange)="onPresetChange($event)">
                  <option value="all">📅 All Time</option>
                  <option value="today">📅 Today</option>
                  <option value="yesterday">📅 Yesterday</option>
                  <option value="this-week">📅 This Week</option>
                  <option value="this-month">📅 This Month</option>
                  <option value="last-month">📅 Last Month</option>
                  <option value="custom">📆 Custom Range...</option>
                </select>

                <div class="date-inputs-wrap-sm">
                  <div class="date-field-sm">
                    <span class="date-label-sm">From:</span>
                    <input
                      type="date"
                      class="date-picker-input-sm"
                      [ngModel]="startDate()"
                      (ngModelChange)="onStartDateChange($event)"
                    />
                  </div>
                  <div class="date-field-sm">
                    <span class="date-label-sm">To:</span>
                    <input
                      type="date"
                      class="date-picker-input-sm"
                      [ngModel]="endDate()"
                      (ngModelChange)="onEndDateChange($event)"
                    />
                  </div>

                  @if (startDate() || endDate() || datePreset() !== 'all') {
                    <button class="btn-clear-date-sm" (click)="clearDateRange()" title="Reset Date Filter">
                      ✕ Reset
                    </button>
                  }
                </div>
              </div>
              <span class="badge badge-neutral">{{ payments().length }} Payment(s)</span>
            </div>
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
                    <th>Screenshot</th>
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
                <button class="btn btn-success" (click)="showQrModal.set(false); openAddPayment.emit()">
                  Log Payment Transaction
                </button>
                <a href="/Image.png" download="Payment_QR_Code.png" class="btn btn-outline-success">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Download QR Code
                </a>
                <button class="btn btn-secondary btn-close-modal" (click)="showQrModal.set(false)">
                  ✕ Close Window
                </button>
              </div>
            </div>
          </div>
        }

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

    @media (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .stats-grid {
        grid-template-columns: 1fr !important;
        gap: 1rem;
      }
    }

    .stat-box {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      min-width: 0;
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
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

    .gpay-card-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      margin-top: 0.4rem;
      width: 100%;
    }

    .gpay-sub {
      font-size: 0.7rem;
      color: var(--text-dim);
      font-weight: 500;
    }

    google-pay-button {
      width: 100%;
      height: 40px;
      display: block;
      border-radius: var(--radius-sm);
      overflow: hidden;
    }

    .btn-gpay-app {
      width: 100%;
      background: linear-gradient(135deg, #1a73e8, #1557b0);
      color: #ffffff;
      font-size: 0.8rem;
      font-weight: 700;
      padding: 0.45rem 0.75rem;
      border-radius: var(--radius-sm);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      transition: var(--transition);

      &:hover {
        background: linear-gradient(135deg, #1557b0, #0d47a1);
        box-shadow: 0 4px 12px rgba(26, 115, 232, 0.4);
      }
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
      flex-wrap: wrap;
      gap: 1rem;
    }

    .history-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .date-range-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .date-preset-select-sm {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 0.35rem 0.65rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 700;
      outline: none;
      cursor: pointer;
      transition: var(--transition);

      &:focus {
        border-color: var(--primary);
      }
    }

    .date-inputs-wrap-sm {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border-color);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      flex-wrap: wrap;
    }

    .date-field-sm {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .date-label-sm {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-dim);
      text-transform: uppercase;
    }

    .date-picker-input-sm {
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-size: 0.775rem;
      font-weight: 600;
      outline: none;
      color-scheme: dark;

      &:focus {
        border-color: var(--primary);
      }
    }

    .btn-clear-date-sm {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
      padding: 0.2rem 0.45rem;
      border-radius: 4px;
      font-size: 0.725rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: rgba(239, 68, 68, 0.3);
        color: #ffffff;
      }
    }

    @media (max-width: 768px) {
      .portal-hero {
        flex-direction: column;
        align-items: stretch;
      }

      .history-actions {
        width: 100%;
        flex-direction: column;
        align-items: stretch;
      }

      .date-range-group {
        width: 100%;
        flex-direction: column;
        align-items: stretch;
      }

      .date-preset-select-sm {
        width: 100%;
      }

      .date-inputs-wrap-sm {
        width: 100%;
        justify-content: space-between;
      }

      .date-field-sm {
        flex: 1;
      }

      .date-picker-input-sm {
        width: 100%;
      }
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
      max-width: 480px;
      max-height: 90vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-modal);
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .qr-modal-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.02);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .qr-modal-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 0;
    }

    .qr-modal-sub {
      font-size: 0.775rem;
      color: var(--text-muted);
      margin-top: 0.2rem;
    }

    .qr-modal-close {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: var(--text-main);
      font-size: 1.5rem;
      cursor: pointer;
      line-height: 1;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      transition: all 0.15s ease;

      &:hover {
        background: rgba(239, 68, 68, 0.25);
        color: #ef4444;
      }
    }

    .qr-modal-body {
      padding: 1.25rem;
      text-align: center;
      flex: 1;
    }

    .qr-img-wrapper {
      background: #ffffff;
      padding: 1rem;
      border-radius: 12px;
      display: inline-block;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      max-width: 100%;
    }

    .qr-modal-img {
      width: auto;
      max-width: 100%;
      max-height: 220px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }

    .qr-instruction {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.75rem;
      line-height: 1.35;
    }

    .qr-modal-footer {
      padding: 1rem 1.25rem;
      background: rgba(15, 23, 42, 0.6);
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
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
export class CustomerPortalComponent {
  private authService = inject(AuthService);
  private customerService = inject(CustomerService);

  openAddPayment = output<void>();
  viewReceipt = output<Payment>();
  showQrModal = signal<boolean>(false);
  activeScreenshotUrl = signal<string | null>(null);

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

  paymentRequest: any = {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [
      {
        type: 'CARD',
        parameters: {
          allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
          allowedCardNetworks: ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA']
        },
        tokenizationSpecification: {
          type: 'PAYMENT_GATEWAY',
          parameters: {
            gateway: 'example',
            gatewayMerchantId: 'exampleGatewayMerchantId'
          }
        }
      }
    ],
    merchantInfo: {
      merchantId: '12345678901234567890',
      merchantName: 'PaperBilling Suite'
    },
    transactionInfo: {
      totalPriceStatus: 'FINAL',
      totalPriceLabel: 'Total',
      totalPrice: '100.00',
      currencyCode: 'USD',
      countryCode: 'US'
    }
  };

  onGooglePaySuccess(event: any): void {
    const cust = this.customer();
    if (!cust) return;

    const today = new Date().toISOString().split('T')[0];
    const txnId = 'GPAY-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    this.customerService.addPayment({
      customerId: cust.id,
      amount: 100,
      paymentDate: today,
      paymentMethod: 'Google Pay',
      referenceNumber: txnId,
      status: 'Complete',
      notes: 'Instant 1-click checkout via Google Pay'
    });

    alert(`🎉 Google Pay Payment Successful!\nTransaction ID: ${txnId}\nAmount: $100.00`);
  }

  onGooglePayError(error: any): void {
    console.error('Google Pay Error:', error);
  }

  openGooglePayApp(): void {
    const cust = this.customer();
    const upiVpa = 'anuragbagdi6635-1@okicici';
    const merchantName = encodeURIComponent('PaperBilling');
    const note = encodeURIComponent(`Bill Payment for ${cust?.name || 'Customer'}`);

    // Direct Google Pay app schemes (Omit &am= parameter so user manually enters amount inside GPay app)
    const gpayAndroidIntent = `intent://pay?pa=${upiVpa}&pn=${merchantName}&cu=INR&tn=${note}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end;`;
    const gpayScheme = `gpay://upi/pay?pa=${upiVpa}&pn=${merchantName}&cu=INR&tn=${note}`;
    const standardUpiUrl = `upi://pay?pa=${upiVpa}&pn=${merchantName}&cu=INR&tn=${note}`;

    const isAndroid = /Android/i.test(navigator.userAgent);

    try {
      window.location.href = isAndroid ? gpayAndroidIntent : gpayScheme;
    } catch (e) {
      window.location.href = standardUpiUrl;
    }

    setTimeout(() => {
      const amtStr = prompt('If your Google Pay payment succeeded, enter the amount paid ($):');
      if (amtStr && !isNaN(Number(amtStr)) && Number(amtStr) > 0) {
        const amount = Number(amtStr);
        const today = new Date().toISOString().split('T')[0];
        const txnId = 'GPAY-APP-' + Math.random().toString(36).substring(2, 9).toUpperCase();

        this.customerService.addPayment({
          customerId: cust?.id || '',
          amount: amount,
          paymentDate: today,
          paymentMethod: 'Google Pay',
          referenceNumber: txnId,
          status: 'Complete',
          notes: 'Payment completed via Google Pay App'
        });
      }
    }, 3000);
  }

  datePreset = signal<string>('all');
  startDate = signal<string>('');
  endDate = signal<string>('');

  onPresetChange(preset: string): void {
    this.datePreset.set(preset);
    const today = new Date();
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'all') {
      this.startDate.set('');
      this.endDate.set('');
    } else if (preset === 'today') {
      const t = formatDate(today);
      this.startDate.set(t);
      this.endDate.set(t);
    } else if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yStr = formatDate(y);
      this.startDate.set(yStr);
      this.endDate.set(yStr);
    } else if (preset === 'this-week') {
      const dayOfWeek = today.getDay();
      const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
      const monday = new Date(today);
      monday.setDate(today.getDate() + diffToMonday);
      this.startDate.set(formatDate(monday));
      this.endDate.set(formatDate(today));
    } else if (preset === 'this-month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      this.startDate.set(formatDate(firstDay));
      this.endDate.set(formatDate(today));
    } else if (preset === 'last-month') {
      const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      this.startDate.set(formatDate(firstDayLastMonth));
      this.endDate.set(formatDate(lastDayLastMonth));
    }
  }

  onStartDateChange(val: string): void {
    this.startDate.set(val);
    this.datePreset.set('custom');
  }

  onEndDateChange(val: string): void {
    this.endDate.set(val);
    this.datePreset.set('custom');
  }

  clearDateRange(): void {
    this.datePreset.set('all');
    this.startDate.set('');
    this.endDate.set('');
  }

  private allCustomerPayments = computed(() => {
    const cust = this.customer();
    if (!cust) return [];
    return this.customerService.getPaymentsByCustomerId(cust.id);
  });

  // Only payments for THIS customer (filtered by date range)
  readonly payments = computed(() => {
    let list = this.allCustomerPayments();
    const start = this.startDate();
    const end = this.endDate();
    if (start) {
      list = list.filter(p => p.paymentDate && p.paymentDate >= start);
    }
    if (end) {
      list = list.filter(p => p.paymentDate && p.paymentDate <= end);
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
