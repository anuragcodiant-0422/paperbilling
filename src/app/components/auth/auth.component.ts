import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CustomerService } from '../../services/customer.service';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <!-- Header Branding -->
        <div class="auth-header">
          <div class="brand-logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <h1 class="brand-title">PaperBilling</h1>
          <p class="brand-subtitle">Sign in to view your payment history or manage customer billing.</p>

          <div class="firebase-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#ffca28" stroke="none">
              <path d="M12.8 1.63a.85.85 0 0 0-1.6 0L8.84 8.08 4.27 4.09a.85.85 0 0 0-1.34.87l3.6 13.9a.85.85 0 0 0 1.25.56l4.22-2.48 4.22 2.48a.85.85 0 0 0 1.25-.56l3.6-13.9a.85.85 0 0 0-1.34-.87l-4.57 3.99z"/>
            </svg>
            <span>Firebase Authentication Enabled</span>
          </div>
        </div>

        <!-- Mode Toggle Tabs -->
        <div class="auth-tabs">
          <button
            class="tab-btn"
            [class.active]="mode() === 'login'"
            (click)="onSwitchTab('login')"
          >
            Sign In
          </button>
          <button
            class="tab-btn"
            [class.active]="mode() === 'register'"
            (click)="onSwitchTab('register')"
          >
            New Customer Register
          </button>
        </div>

        <!-- Success Notification Box -->
        @if (successMessage()) {
          <div class="success-alert">
            <div class="alert-icon">✓</div>
            <div>{{ successMessage() }}</div>
          </div>
        }

        <!-- Login Form -->
        @if (mode() === 'login') {
          <form (ngSubmit)="onLoginSubmit()">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input
                type="email"
                class="form-control"
                placeholder="e.g. billing@apextech.com or admin@paperbilling.com"
                [(ngModel)]="email"
                name="email"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Firebase Password</label>
              <input
                type="password"
                class="form-control"
                placeholder="••••••••"
                [(ngModel)]="password"
                name="password"
                required
              />
            </div>

            @if (errorMessage()) {
              <div class="error-alert">
                {{ errorMessage() }}
              </div>
            }

            <button type="submit" class="btn btn-primary btn-block mt-4" [disabled]="isLoading()">
              {{ isLoading() ? 'Authenticating with Firebase...' : 'Sign In' }}
            </button>
          </form>
        }

        <!-- Register Customer Form -->
        @if (mode() === 'register') {
          <form (ngSubmit)="onRegisterSubmit()">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input
                type="text"
                class="form-control"
                placeholder="e.g. Alex Morgan"
                [(ngModel)]="regName"
                name="regName"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Email Address *</label>
              <input
                type="email"
                class="form-control"
                placeholder="alex@company.com"
                [(ngModel)]="regEmail"
                name="regEmail"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Firebase Password *</label>
              <input
                type="password"
                class="form-control"
                placeholder="Minimum 6 characters"
                [(ngModel)]="regPassword"
                name="regPassword"
                required
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Phone Number (10 Digits) *</label>
                <input
                  type="tel"
                  class="form-control"
                  placeholder="e.g. 9876543210 (10 digits)"
                  [(ngModel)]="regPhone"
                  (input)="onRegPhoneInput($event)"
                  maxlength="10"
                  name="regPhone"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Company Name</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Morgan Tech"
                  [(ngModel)]="regCompany"
                  name="regCompany"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Address</label>
              <input
                type="text"
                class="form-control"
                placeholder="Billing address"
                [(ngModel)]="regAddress"
                name="regAddress"
              />
            </div>

            @if (errorMessage()) {
              <div class="error-alert">
                {{ errorMessage() }}
              </div>
            }

            <button type="submit" class="btn btn-success btn-block mt-4" [disabled]="isLoading()">
              {{ isLoading() ? 'Storing Data in Firebase...' : 'Save to Firebase & Register' }}
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }

    .auth-card {
      width: 100%;
      max-width: 440px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 2rem;
      box-shadow: var(--shadow-lg);
      animation: slideUp 0.25s ease-out;
    }

    @media (max-width: 640px) {
      .auth-wrapper {
        padding: 1rem 0.5rem;
      }

      .auth-card {
        padding: 1.25rem 1rem;
      }

      .brand-title {
        font-size: 1.3rem;
      }
    }

    .auth-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .brand-logo {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: #fff;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 0.875rem auto;
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
    }

    .brand-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--text-main);
      line-height: 1.2;
    }

    .brand-subtitle {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 0.35rem;
    }

    .firebase-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(255, 202, 40, 0.12);
      border: 1px solid rgba(255, 202, 40, 0.3);
      color: #ffca28;
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: 0.725rem;
      font-weight: 700;
      margin-top: 0.75rem;
    }

    .auth-tabs {
      display: flex;
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.25rem;
      margin-bottom: 1.5rem;
    }

    .tab-btn {
      flex: 1;
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 0.6rem 0.5rem;
      font-size: 0.8125rem;
      font-weight: 600;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: var(--transition);
    }

    .tab-btn.active {
      background: var(--bg-card);
      color: var(--text-main);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }

    .success-alert {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      background-color: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
      padding: 0.875rem 1rem;
      border-radius: var(--radius-md);
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 1.25rem;
      line-height: 1.45;
    }

    .alert-icon {
      background: #10b981;
      color: #fff;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      flex-shrink: 0;
      margin-top: 0.1rem;
    }

    .btn-block {
      width: 100%;
    }

    .mt-4 { margin-top: 1.25rem; }

    .error-alert {
      background-color: var(--danger-bg);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: var(--danger);
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      font-size: 0.8125rem;
      font-weight: 500;
      margin-top: 0.5rem;
    }
  `]
})
export class AuthComponent {
  private authService = inject(AuthService);
  private customerService = inject(CustomerService);

  mode = signal<AuthMode>('login');
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  // Login inputs
  email = '';
  password = '';

  // Register inputs
  regName = '';
  regEmail = '';
  regPassword = '';
  regPhone = '';
  regCompany = '';
  regAddress = '';

  onRegPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.regPhone = input.value.replace(/\D/g, '').slice(0, 10);
  }

  onSwitchTab(newMode: AuthMode): void {
    this.mode.set(newMode);
    this.errorMessage.set('');
  }

  async onLoginSubmit(): Promise<void> {
    if (!this.email.trim()) {
      this.errorMessage.set('Please enter your email address.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const res = await this.authService.login(this.email, this.password);
      if (!res.success) {
        this.errorMessage.set(res.message || 'Firebase login failed.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  async onRegisterSubmit(): Promise<void> {
    if (!this.regName.trim() || !this.regEmail.trim()) {
      this.errorMessage.set('Full name and email address are required.');
      return;
    }
    if (!this.regPhone.trim()) {
      this.errorMessage.set('Phone number is required.');
      return;
    }
    const cleanPhone = this.regPhone.replace(/\D/g, '').trim();
    if (cleanPhone.length !== 10) {
      this.errorMessage.set('Phone number must be exactly 10 digits (numbers only).');
      return;
    }
    if (!this.customerService.isPhoneUnique(cleanPhone)) {
      this.errorMessage.set('This phone number is already registered to another customer.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const res = await this.authService.registerCustomer({
        name: this.regName,
        email: this.regEmail,
        password: this.regPassword,
        phone: cleanPhone,
        company: this.regCompany,
        address: this.regAddress
      });

      if (res.success) {
        // Show success alert and pre-fill login inputs instead of rendering dashboard immediately
        this.successMessage.set(res.message || 'Registration data successfully saved to Firebase! Please Sign In below.');
        this.email = this.regEmail;
        this.password = this.regPassword;
        this.mode.set('login');

        // Clear register inputs
        this.regName = '';
        this.regEmail = '';
        this.regPassword = '';
        this.regPhone = '';
        this.regCompany = '';
        this.regAddress = '';
      } else {
        this.errorMessage.set(res.message || 'Firebase registration failed.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
