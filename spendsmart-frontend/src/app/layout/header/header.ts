import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Input, OnInit, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, interval, startWith } from 'rxjs';
import { AppNotification } from '../../core/models/api.models';
import { NotificationsApiService } from '../../core/services/notifications-api.service';
import { SessionService } from '../../core/services/session.service';
import { daysAgoLabel, severityClass } from '../../core/utils/formatters';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent implements OnInit {
  @Input() pageTitle = 'Dashboard';

  protected readonly session = inject(SessionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notificationsApi = inject(NotificationsApiService);
  private readonly router = inject(Router);

  showNotifModal = false;
  unreadCount = 0;
  notifications: AppNotification[] = [];
  monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  displayName = computed(() => this.session.profile()?.fullName ?? this.session.session()?.fullName ?? 'Account');

  ngOnInit(): void {
    interval(30000).pipe(startWith(0), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshUnreadCount());

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.refreshUnreadCount());
  }

  openNotif(): void {
    this.showNotifModal = true;
    const userId = this.session.userId();
    if (!userId) return;
    this.notificationsApi.listByRecipient(userId).subscribe({
      next: items => {
        this.notifications = items.slice(0, 5);
        this.unreadCount = items.filter(n => !n.read).length;
      }
    });
  }

  closeNotif(): void { this.showNotifModal = false; }

  addExpense(): void {
    this.router.navigate(['/app/expenses'], { queryParams: { openAdd: 1 } });
  }

  markRead(notification: AppNotification): void {
    this.notificationsApi.markAsRead(notification.notificationId).subscribe({
      next: () => {
        notification.read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
    });
  }

  logout(): void {
    this.session.clear();
    this.router.navigate(['/']);
  }

  notifTime(n: AppNotification): string { return daysAgoLabel(n.createdAt); }
  notifClass(n: AppNotification): string { return severityClass(n.severity); }

  private refreshUnreadCount(): void {
    const userId = this.session.userId();
    if (!userId) return;
    this.notificationsApi.unreadCount(userId).subscribe({
      next: count => (this.unreadCount = count)
    });
  }
}