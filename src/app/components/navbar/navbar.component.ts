import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../services/customer.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="navbar">
      <div class="container navbar-container">
        <!-- Logo & Brand -->
        <div class="brand">
          <div class="brand-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div class="brand-text">
            <span class="brand-name">PaperBilling</span>
            <span class="brand-tag">
              {{ auth.isCustomer() ? 'Customer Payment Portal' : 'Billing & Payment Suite' }}
            </span>
          </div>
        </div>

        <!-- Metric Badges Summary (Admin Only) -->
        @if (auth.isAdmin()) {
          <div class="stats-ribbon">
            <div class="stat-card">
              <div class="stat-label">Total Customers</div>
              <div class="stat-value">{{ summary().totalCustomers }}</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-card">
              <div class="stat-label">Total Collected</div>
              <div class="stat-value text-success">\${{ summary().totalCollected | number:'1.2-2' }}</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-card">
              <div class="stat-label">Total Payments</div>
              <div class="stat-value">{{ customerService.payments().length }}</div>
            </div>
          </div>
        }

        <!-- User Profile & Action Controls -->
        <div class="nav-actions">
          @if (auth.isLoggedIn(); as user) {
            <div class="user-profile-badge">
              <div class="user-avatar" [title]="auth.currentUser()?.name || ''">
                {{ getInitials(auth.currentUser()?.name || '') }}
              </div>
              <div class="user-info">
                <span class="user-name">{{ auth.currentUser()?.name }}</span>
                <span class="user-role" [class.admin-role]="auth.isAdmin()">
                  {{ auth.isAdmin() ? 'Administrator' : 'Customer Account' }}
                </span>
              </div>
            </div>

            @if (auth.isAdmin()) {
              <button class="btn btn-primary btn-sm btn-add-cust" (click)="openAddCustomerModal.emit()">
                <span class="btn-icon-plus">+</span>
                <span class="btn-label-cust">Add Customer</span>
              </button>
            }

            <button class="btn btn-secondary btn-sm btn-signout" (click)="auth.logout()" title="Sign Out">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span class="signout-text">Sign Out</span>
            </button>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      background-color: rgba(30, 41, 59, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 100;
      padding: 0.875rem 0;
    }

    .navbar-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-icon {
      width: 42px;
      height: 42px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-main);
      line-height: 1.2;
      letter-spacing: -0.02em;
    }

    .brand-tag {
      font-size: 0.725rem;
      font-weight: 500;
      color: var(--text-muted);
    }

    .stats-ribbon {
      display: flex;
      align-items: center;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border-color);
      padding: 0.5rem 1.25rem;
      border-radius: var(--radius-full);
      gap: 1.25rem;
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-label {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-dim);
    }

    .stat-value {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .text-billed { color: #818cf8; }
    .text-success { color: #34d399; }
    .text-warning { color: #fbbf24; }

    .stat-divider {
      width: 1px;
      height: 24px;
      background-color: var(--border-color);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .user-profile-badge {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid var(--border-color);
      padding: 0.35rem 0.75rem 0.35rem 0.4rem;
      border-radius: var(--radius-full);
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      background: #4f46e5;
      color: #fff;
      font-weight: 700;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.1;
    }

    .user-role {
      font-size: 0.6875rem;
      color: var(--text-muted);
    }

    .admin-role {
      color: #818cf8;
      font-weight: 600;
    }

    @media (max-width: 960px) {
      .stats-ribbon {
        display: none;
      }
    }

    @media (max-width: 640px) {
      .navbar {
        padding: 0.5rem 0;
      }

      .navbar-container {
        gap: 0.35rem;
      }

      .brand {
        gap: 0.5rem;
      }

      .brand-name {
        font-size: 1rem;
      }

      .brand-tag {
        font-size: 0.65rem;
      }

      .brand-icon {
        width: 32px;
        height: 32px;
      }

      .user-info {
        display: none;
      }

      .user-profile-badge {
        padding: 0;
        background: transparent;
        border: none;
      }

      .nav-actions {
        gap: 0.35rem;
        flex-shrink: 0;
      }

      .btn-add-cust, .btn-signout {
        padding: 0.35rem 0.55rem;
        font-size: 0.775rem;
      }
    }

    @media (max-width: 480px) {
      .brand-tag {
        display: none;
      }

      .btn-label-cust {
        display: none;
      }

      .signout-text {
        display: none;
      }

      .btn-signout {
        padding: 0.4rem;
      }

      .btn-add-cust {
        padding: 0.4rem 0.6rem;
      }
    }
  `]
})
export class NavbarComponent {
  customerService = inject(CustomerService);
  auth = inject(AuthService);

  readonly summary = this.customerService.financialSummary;

  openAddCustomerModal = output<void>();

  getInitials(name: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
