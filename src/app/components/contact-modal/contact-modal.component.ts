import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { EnquiryService } from '../../services/enquiry.service';

@Component({
  selector: 'app-contact-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal-content contact-modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="header-title-group">
            <h2 class="modal-title">Contact Us </h2>
          
          </div>
          <button class="modal-close" (click)="onClose()">&times;</button>
        </div>

        <div class="modal-body contact-modal-body">
          <div class="contact-grid">
            <!-- Left Side: Business Information Card -->
            <div class="biz-info-card">
              <div class="biz-brand-header">
                <div class="biz-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="biz-name">PaperBilling Inc.</h3>
                  <span class="biz-tag">Billing & Payment Solutions</span>
                </div>
              </div>

              <div class="biz-info-list">
                <div class="info-item">
                  <div class="info-icon">📍</div>
                  <div class="info-text">
                    <span class="info-label">Office Address</span>
                    <span class="info-val">148 lig, indore</span>
                  </div>
                </div>

                <div class="info-item">
                  <div class="info-icon">📞</div>
                  <div class="info-text">
                    <span class="info-label">Phone Numbers</span>
                    <span class="info-val">+91 7987560718</span>
                 
                  </div>
                </div>

                <div class="info-item">
                  <div class="info-icon">✉️</div>
                  <div class="info-text">
                    <span class="info-label">Email Address</span>
                    <span class="info-val">anuragbagdi6635@gmail.com</span>
                  </div>
                </div>

              
              </div>

              <div class="priority-badge">
                <span class="p-dot"></span>
                <span>24/7 Fast Response for Billing Inquiries</span>
              </div>
            </div>

            <!-- Right Side: Contact Form -->
            <div class="contact-form-card">
              <h3 class="form-section-title">Send Us a Message</h3>

              @if (isSubmitted()) {
                <div class="success-alert">
                  <div class="success-icon">🎉</div>
                  <div class="success-msg-wrap">
                    <h4>Message Sent Successfully!</h4>
                    <p>Thank you for reaching out, <strong>{{ senderName }}</strong>. Our support team will get back to you shortly.</p>
                  </div>
                  <button type="button" class="btn btn-primary btn-sm mt-3" (click)="resetForm()">Send Another Message</button>
                </div>
              } @else {
                <form (ngSubmit)="onSubmit()">
                  <div class="form-group">
                    <label class="form-label">Full Name *</label>
                    <input
                      type="text"
                      class="form-control"
                      placeholder="e.g. John Smith"
                      [(ngModel)]="senderName"
                      name="senderName"
                      required
                    />
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Email Address *</label>
                      <input
                        type="email"
                        class="form-control"
                        placeholder="e.g. john&#64;company.com"
                        [(ngModel)]="senderEmail"
                        name="senderEmail"
                        required
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label">Phone Number (10 Digits) *</label>
                      <input
                        type="tel"
                        class="form-control"
                        placeholder="10 digit phone number"
                        [(ngModel)]="senderPhone"
                        (input)="onPhoneInput($event)"
                        maxlength="10"
                        name="senderPhone"
                        required
                      />
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Subject / Inquiry Type *</label>
                    <select class="form-control" [(ngModel)]="subject" name="subject">
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="General Inquiry">Template distribution</option>
                      <option value="Billing & Invoices">Billing & Invoices</option>
                      <option value="Payment Support">Payment Support</option>
                      <option value="Technical Assistance">Technical Assistance</option>
                    
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Message Details *</label>
                    <textarea
                      class="form-control"
                      rows="3"
                      placeholder="How can we help you?"
                      [(ngModel)]="message"
                      name="message"
                      required
                    ></textarea>
                  </div>

                  @if (errorMessage()) {
                    <div class="error-alert">
                      {{ errorMessage() }}
                    </div>
                  }

                  <div class="form-actions">
                    <button type="submit" class="btn btn-primary btn-submit-contact" [disabled]="isSubmitting()">
                      {{ isSubmitting() ? 'Sending Message...' : 'Send Message' }}
                    </button>
                  </div>
                </form>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contact-modal-card {
      max-width: 820px !important;
      width: 100%;
    }

    .contact-modal-body {
      padding: 1.5rem;
    }

    .contact-grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 1.5rem;
    }

    /* Left Side: Business Info Card */
    .biz-info-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .biz-brand-header {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    .biz-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
    }

    .biz-name {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 0;
    }

    .biz-tag {
      font-size: 0.725rem;
      color: var(--text-muted);
    }

    .biz-info-list {
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
    }

    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .info-icon {
      font-size: 1.15rem;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.35rem 0.5rem;
      border-radius: 8px;
      line-height: 1;
    }

    .info-text {
      display: flex;
      flex-direction: column;
    }

    .info-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-dim);
      letter-spacing: 0.04em;
    }

    .info-val {
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--text-main);
      margin-top: 0.15rem;
      line-height: 1.35;
    }

    .info-sub-val {
      font-size: 0.775rem;
      color: var(--text-muted);
      margin-top: 0.1rem;
    }

    .priority-badge {
      margin-top: 1.5rem;
      padding: 0.65rem 0.85rem;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: var(--radius-sm);
      color: #34d399;
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .p-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 8px #10b981;
    }

    /* Right Side: Contact Form Card */
    .contact-form-card {
      background: var(--bg-card);
    }

    .form-section-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 1rem;
    }

    .btn-submit-contact {
      width: 100%;
      justify-content: center;
      padding: 0.75rem;
      font-size: 0.9rem;
      font-weight: 700;
      margin-top: 0.5rem;
    }

    .success-alert {
      text-align: center;
      padding: 2rem 1rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: var(--radius-md);
      color: var(--text-main);
    }

    .success-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .success-msg-wrap h4 {
      color: #34d399;
      font-weight: 800;
      margin-bottom: 0.35rem;
    }

    .success-msg-wrap p {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .mt-3 { margin-top: 1rem; }

    @media (max-width: 768px) {
      .contact-modal-card {
        max-height: 90vh !important;
        margin-bottom: 0 !important;
        border-bottom-left-radius: 0 !important;
        border-bottom-right-radius: 0 !important;
      }

      .contact-modal-body {
        padding: 1rem !important;
        padding-bottom: max(1.5rem, env(safe-area-inset-bottom, 1.5rem)) !important;
      }

      .contact-grid {
        grid-template-columns: 1fr !important;
        gap: 1rem !important;
      }

      .biz-info-card {
        padding: 1rem !important;
      }

      .biz-brand-header {
        margin-bottom: 0.85rem !important;
        padding-bottom: 0.75rem !important;
      }

      .biz-info-list {
        gap: 0.75rem !important;
      }

      .info-item {
        gap: 0.6rem !important;
      }

      .priority-badge {
        margin-top: 0.85rem !important;
        padding: 0.5rem 0.75rem !important;
        font-size: 0.725rem !important;
      }

      .form-row {
        display: flex !important;
        flex-direction: column !important;
        gap: 0.75rem !important;
      }

      .form-group {
        margin-bottom: 0.75rem !important;
      }

      .form-control {
        font-size: 16px !important; /* Prevents auto-zoom on iPhone Safari inputs */
        padding: 0.65rem 0.85rem !important;
      }

      .btn-submit-contact {
        min-height: 46px !important;
        font-size: 1rem !important;
      }
    }
  `]
})
export class ContactModalComponent {
  private firebaseService = inject(FirebaseService);
  private enquiryService = inject(EnquiryService);

  close = output<void>();

  senderName = '';
  senderEmail = '';
  senderPhone = '';
  subject = 'General Inquiry';
  message = '';

  isSubmitting = signal<boolean>(false);
  isSubmitted = signal<boolean>(false);
  errorMessage = signal<string>('');

  onClose(): void {
    this.close.emit();
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.senderPhone = input.value.replace(/\D/g, '').slice(0, 10);
  }

  async onSubmit(): Promise<void> {
    if (!this.senderName.trim()) {
      this.errorMessage.set('Please enter your full name.');
      return;
    }
    if (!this.senderEmail.trim()) {
      this.errorMessage.set('Please enter your email address.');
      return;
    }
    if (!this.senderPhone.trim()) {
      this.errorMessage.set('Phone number is required.');
      return;
    }
    const cleanPhone = this.senderPhone.replace(/\D/g, '').trim();
    if (cleanPhone.length !== 10) {
      this.errorMessage.set('Phone number must be exactly 10 digits.');
      return;
    }
    if (!this.message.trim()) {
      this.errorMessage.set('Please enter your message details.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    // Save directly to Firebase 'enquiries' collection
    await this.enquiryService.addEnquiry({
      name: this.senderName.trim(),
      email: this.senderEmail.trim(),
      phone: cleanPhone,
      subject: this.subject,
      message: this.message.trim()
    });

    this.isSubmitting.set(false);
    this.isSubmitted.set(true);
  }

  resetForm(): void {
    this.senderName = '';
    this.senderEmail = '';
    this.senderPhone = '';
    this.subject = 'General Inquiry';
    this.message = '';
    this.isSubmitted.set(false);
    this.errorMessage.set('');
  }
}
