import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../services/customer.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

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
              <!-- Admin Firebase Notifications Bell 🔔 -->
              <div class="notif-wrapper">
                <button class="notif-btn" (click)="toggleNotifDropdown($event)" title="Firebase Live Registration Notifications">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  @if (notifService.unreadCount() > 0) {
                    <span class="notif-badge">{{ notifService.unreadCount() }}</span>
                  }
                </button>

                @if (showNotifDropdown()) {
                  <div class="notif-dropdown" (click)="$event.stopPropagation()">
                    <div class="notif-header">
                      <div class="notif-title-wrap">
                        <span class="notif-head-title">Admin Notifications</span>
                        <span class="notif-head-tag">Firebase Realtime</span>
                      </div>
                      @if (notifService.notifications().length > 0) {
                        <button class="btn-clear-notif" (click)="notifService.clearAll()">Clear All</button>
                      }
                    </div>

                    <div class="notif-list">
                      @if (notifService.notifications().length === 0) {
                        <div class="notif-empty">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                          </svg>
                          <p>No new notifications</p>
                        </div>
                      } @else {
                        @for (item of notifService.notifications(); track item.id) {
                          <div class="notif-item" [class.unread]="!item.read" (click)="notifService.markAsRead(item.id)">
                            <div class="notif-item-icon">👤</div>
                            <div class="notif-item-body">
                              <div class="notif-item-title">{{ item.title }}</div>
                              <div class="notif-item-msg">{{ item.message }}</div>
                              <div class="notif-item-time">{{ formatTime(item.createdAt) }}</div>
                            </div>
                            @if (!item.read) {
                              <span class="unread-dot" title="Unread Alert"></span>
                            }
                          </div>
                        }
                      }
                    </div>
                  </div>
                }
              </div>

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
          } @else {
            <!-- Contact Us Button (Visible ONLY outside login page when logged out) -->
            <button class="btn btn-outline-contact" (click)="openContactModal.emit()" title="Contact Support & Business Info">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span class="contact-btn-label">Contact Us</span>
            </button>
          }
        </div>
      </div>

      <!-- Live Floating Registration Toast Alert Banner -->
      @if (auth.isAdmin() && notifService.toastNotification(); as toast) {
        <div class="toast-banner-wrapper">
          <div class="toast-banner">
            <div class="toast-icon">👤</div>
            <div class="toast-content">
              <span class="toast-title">New User Registration Saved in Firebase!</span>
              <span class="toast-sub"><strong>{{ toast.customerName }}</strong> ({{ toast.customerEmail }}) • Tel: {{ toast.customerPhone }}</span>
            </div>
            <button class="toast-close" (click)="notifService.closeToast()">&times;</button>
          </div>
        </div>
      }
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

    .notif-wrapper {
      position: relative;
    }

    .notif-btn {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      transition: all 0.15s ease;

      &:hover {
        background: rgba(99, 102, 241, 0.2);
        border-color: #6366f1;
        color: #818cf8;
      }
    }

    .notif-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #ef4444;
      color: #ffffff;
      font-size: 0.65rem;
      font-weight: 800;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
    }

    .notif-dropdown {
      position: absolute;
      top: 45px;
      right: 0;
      width: 320px;
      background: var(--bg-card);
      border: 1px solid var(--border-highlight);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-modal);
      z-index: 1000;
      overflow: hidden;
      animation: slideUp 0.2s ease-out;
    }

    .notif-header {
      padding: 0.75rem 1rem;
      background: rgba(15, 23, 42, 0.8);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .notif-head-title {
      font-size: 0.85rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .notif-head-tag {
      font-size: 0.65rem;
      background: rgba(99, 102, 241, 0.2);
      color: #818cf8;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      margin-left: 0.4rem;
    }

    .btn-clear-notif {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 0.725rem;
      cursor: pointer;

      &:hover { color: #f87171; }
    }

    .notif-list {
      max-height: 320px;
      overflow-y: auto;
    }

    .notif-empty {
      padding: 2rem 1rem;
      text-align: center;
      color: var(--text-dim);
      font-size: 0.8rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .notif-item {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      cursor: pointer;
      transition: background 0.15s ease;
      position: relative;

      &:hover { background: rgba(255, 255, 255, 0.03); }
      &.unread { background: rgba(99, 102, 241, 0.08); }
    }

    .notif-item-icon {
      font-size: 1.1rem;
      line-height: 1;
      padding: 0.25rem;
      background: rgba(99, 102, 241, 0.15);
      border-radius: 6px;
    }

    .notif-item-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .notif-item-msg {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
      line-height: 1.3;
    }

    .notif-item-time {
      font-size: 0.675rem;
      color: var(--text-dim);
      margin-top: 0.25rem;
    }

    .unread-dot {
      width: 8px;
      height: 8px;
      background: #3b82f6;
      border-radius: 50%;
      margin-top: 0.2rem;
      flex-shrink: 0;
    }

    .toast-banner-wrapper {
      position: fixed;
      top: 75px;
      right: 20px;
      z-index: 1100;
      animation: slideUp 0.3s ease-out;
    }

    .toast-banner {
      background: #0f172a;
      border: 1px solid #6366f1;
      border-left: 4px solid #10b981;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      max-width: 380px;
    }

    .toast-icon { font-size: 1.25rem; }

    .toast-content {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .toast-title {
      font-size: 0.8rem;
      font-weight: 800;
      color: #34d399;
    }

    .toast-sub {
      font-size: 0.725rem;
      color: var(--text-main);
      margin-top: 0.15rem;
    }

    .btn-outline-contact {
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: #a5b4fc;
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.45rem 0.85rem;
      border-radius: var(--radius-md);
      font-size: 0.8125rem;
      font-weight: 700;
      transition: all 0.15s ease;
      cursor: pointer;

      &:hover {
        background: rgba(99, 102, 241, 0.3);
        border-color: #818cf8;
        color: #ffffff;
      }
    }

    .toast-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.1rem;
      cursor: pointer;
      padding: 0 0.2rem;

      &:hover { color: #ffffff; }
    }
  `]
})
export class NavbarComponent {
  customerService = inject(CustomerService);
  auth = inject(AuthService);
  notifService = inject(NotificationService);

  readonly summary = this.customerService.financialSummary;
  showNotifDropdown = signal<boolean>(false);

  openAddCustomerModal = output<void>();
  openContactModal = output<void>();

  toggleNotifDropdown(event?: Event): void {
    if (event) event.stopPropagation();
    this.showNotifDropdown.update(val => !val);
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

  formatTime(isoStr: string): string {
    if (!isoStr) return '';
    try {
      const date = new Date(isoStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + date.toLocaleDateString();
    } catch (e) {
      return isoStr;
    }
  }
}
