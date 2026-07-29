import { Injectable, signal, computed, inject } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { AppNotification } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private firebaseService = inject(FirebaseService);

  readonly notifications = signal<AppNotification[]>([]);
  readonly toastNotification = signal<AppNotification | null>(null);

  readonly unreadCount = computed(() => {
    return this.notifications().filter(n => !n.read).length;
  });

  private unsubscribeListener: (() => void) | null = null;
  private previousIds = new Set<string>();

  constructor() {
    this.initNotificationsListener();
  }

  initNotificationsListener(): void {
    if (this.unsubscribeListener) {
      this.unsubscribeListener();
    }

    // Initial fetch from Firebase
    this.firebaseService.fetchNotificationsFromFirebase().then(initialList => {
      this.notifications.set(initialList);
      initialList.forEach(n => this.previousIds.add(n.id));
    });

    // Real-time listener for live updates from Firebase
    this.unsubscribeListener = this.firebaseService.listenNotificationsFromFirebase((latestList) => {
      // Check for newly added registration notifications to show live toast banner
      if (this.previousIds.size > 0) {
        const newlyAdded = latestList.find(n => !this.previousIds.has(n.id) && n.type === 'NEW_REGISTRATION');
        if (newlyAdded) {
          this.toastNotification.set(newlyAdded);
          setTimeout(() => {
            this.toastNotification.set(null);
          }, 6000);
        }
      }

      this.previousIds = new Set(latestList.map(n => n.id));
      this.notifications.set(latestList);
    });
  }

  async markAsRead(id: string): Promise<void> {
    this.notifications.update(list =>
      list.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    await this.firebaseService.markNotificationAsReadInFirebase(id);
  }

  async clearAll(): Promise<void> {
    this.notifications.set([]);
    this.previousIds.clear();
    await this.firebaseService.clearAllNotificationsFromFirebase();
  }

  closeToast(): void {
    this.toastNotification.set(null);
  }
}
