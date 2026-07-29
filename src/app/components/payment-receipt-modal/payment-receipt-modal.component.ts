import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Customer, Payment } from '../../models/customer.model';

@Component({
  selector: 'app-payment-receipt-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal-content modal-lg printable-receipt" (click)="$event.stopPropagation()">
        <div class="modal-header no-print">
          <h2 class="modal-title">Payment Receipt</h2>
          <div class="header-actions">
            <button class="btn btn-secondary btn-sm" (click)="onPrint()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Print Receipt
            </button>
            <button class="modal-close" (click)="onClose()">&times;</button>
          </div>
        </div>

        <div class="modal-body receipt-card">
          <!-- Receipt Header -->
          <div class="receipt-header-banner">
            <div class="company-brand">
              <div class="logo-box">PB</div>
              <div>
                <h3 class="company-name">PaperBilling Billing Corp</h3>
                <p class="company-address">100 Tech Park Way, Suite 500 &bull; support&#64;paperbilling.com</p>
              </div>
            </div>
            <div class="receipt-badge-wrap">
              <span class="official-stamp">PAYMENT RECEIPT</span>
              <span class="receipt-num">Ref: {{ payment()?.referenceNumber }}</span>
            </div>
          </div>

          <div class="receipt-divider"></div>

          <!-- Customer & Meta Grid -->
          <div class="receipt-info-grid">
            <div class="info-block">
              <span class="info-label">RECEIVED FROM</span>
              <strong class="info-val-title">{{ customer()?.name }}</strong>
              <div class="info-sub">{{ customer()?.company }}</div>
              <div class="info-sub">{{ customer()?.email }}</div>
              <div class="info-sub">{{ customer()?.phone }}</div>
            </div>

            <div class="info-block align-right">
              <div class="meta-item">
                <span class="info-label">PAYMENT DATE</span>
                <span class="meta-val">{{ payment()?.paymentDate }}</span>
              </div>
              <div class="meta-item mt-2">
                <span class="info-label">PAYMENT METHOD</span>
                <span class="meta-val">{{ payment()?.paymentMethod }}</span>
              </div>
              <div class="meta-item mt-2">
                <span class="info-label">STATUS</span>
                <span class="badge badge-success">COMPLETED</span>
              </div>
            </div>
          </div>

          <!-- Payment Amount Highlight -->
          <div class="amount-box">
            <div class="amount-title">AMOUNT RECEIVED</div>
            <div class="amount-figure">\${{ payment()?.amount | number:'1.2-2' }}</div>
            <div class="amount-words">Paid via {{ payment()?.paymentMethod }}</div>
          </div>

          <!-- Transaction Summary Table -->
          <table class="receipt-table">
            <thead>
              <tr>
                <th>Description / Notes</th>
                <th>Reference #</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ payment()?.notes || 'Customer Payment Credit' }}</td>
                <td><code>{{ payment()?.referenceNumber }}</code></td>
                <td class="text-right font-bold">\${{ payment()?.amount | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Attached Screenshot Proof -->
          @if (payment()?.screenshotUrl; as ss) {
            <div class="receipt-ss-box">
              <span class="info-label">ATTACHED PAYMENT PROOF SCREENSHOT</span>
              <img [src]="ss" alt="Payment Proof Screenshot" class="receipt-ss-img" />
            </div>
          }

          <!-- Payment Summary Banner -->
          @if (customer(); as cust) {
            <div class="balance-summary-box">
              <div class="b-col">
                <span class="b-lbl">Total Payments Recorded</span>
                <span class="b-txt text-success">\${{ cust.totalPaid | number:'1.2-2' }}</span>
              </div>
            </div>
          }

          <div class="receipt-footer-note">
            <p>Thank you for your prompt payment! If you have any questions regarding this receipt, please contact accounting&#64;paperbilling.com.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .receipt-card {
      background: #ffffff;
      color: #1e293b;
      padding: 2rem;
      border-radius: var(--radius-md);
    }

    .receipt-header-banner {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .company-brand {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .logo-box {
      width: 48px;
      height: 48px;
      background: #4f46e5;
      color: #fff;
      font-weight: 800;
      font-size: 1.25rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .company-name {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
    }

    .company-address {
      font-size: 0.75rem;
      color: #64748b;
    }

    .receipt-badge-wrap {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .official-stamp {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #10b981;
      padding: 0.25rem 0.75rem;
      font-weight: 800;
      font-size: 0.75rem;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }

    .receipt-num {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 0.25rem;
      font-family: monospace;
    }

    .receipt-divider {
      height: 1px;
      background: #e2e8f0;
      margin: 1.5rem 0;
    }

    .receipt-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .info-label {
      font-size: 0.6875rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 0.2rem;
    }

    .info-val-title {
      font-size: 1.1rem;
      color: #0f172a;
    }

    .info-sub {
      font-size: 0.8125rem;
      color: #475569;
    }

    .align-right {
      text-align: right;
    }

    .meta-val {
      font-size: 0.9rem;
      font-weight: 600;
      color: #1e293b;
    }

    .mt-2 { margin-top: 0.5rem; }

    .amount-box {
      background: #f8fafc;
      border: 1px border #e2e8f0;
      border-radius: var(--radius-md);
      padding: 1.25rem;
      text-align: center;
      margin: 1.5rem 0;
    }

    .amount-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.05em;
    }

    .amount-figure {
      font-size: 2.25rem;
      font-weight: 800;
      color: #059669;
      line-height: 1.1;
      margin: 0.25rem 0;
    }

    .amount-words {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .receipt-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.5rem;
    }

    .receipt-table th {
      background: #f1f5f9;
      color: #475569;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.75rem;
      text-align: left;
    }

    .receipt-table td {
      padding: 0.875rem 0.75rem;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.875rem;
      color: #1e293b;
    }

    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }

    .balance-summary-box {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      background: #f8fafc;
      border-radius: var(--radius-md);
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .b-col {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .b-lbl {
      font-size: 0.6875rem;
      color: #64748b;
      font-weight: 600;

    }

    .b-txt {
      font-size: 0.9375rem;
      font-weight: 700;
      color: #0f172a;
    }

    .text-success { color: #059669; }
    .text-warning { color: #d97706; }

    .receipt-footer-note {
      text-align: center;
      font-size: 0.75rem;
      color: #94a3b8;
      border-top: 1px dashed #cbd5e1;
      padding-top: 1rem;
    }

    .receipt-ss-box {
      margin: 1.25rem 0;
      padding: 1rem;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: var(--radius-md);
      text-align: center;
    }

    .receipt-ss-img {
      max-width: 100%;
      max-height: 240px;
      object-fit: contain;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      margin-top: 0.5rem;
    }
  `]
})
export class PaymentReceiptModalComponent {
  customer = input<Customer | undefined>();
  payment = input<Payment | undefined>();
  close = output<void>();

  onClose(): void {
    this.close.emit();
  }

  onPrint(): void {
    window.print();
  }
}
