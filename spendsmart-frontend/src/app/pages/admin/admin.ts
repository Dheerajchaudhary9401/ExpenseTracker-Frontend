import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppNotification, UserProfile } from '../../core/models/api.models';
import { AuthApiService } from '../../core/services/auth-api.service';
import { ExpensesApiService } from '../../core/services/expenses-api.service';
import { IncomeApiService } from '../../core/services/income-api.service';
import { NotificationsApiService } from '../../core/services/notifications-api.service';
import { SessionService } from '../../core/services/session.service';
import { formatCurrency } from '../../core/utils/formatters';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {
  private readonly authApi = inject(AuthApiService);
  private readonly expensesApi = inject(ExpensesApiService);
  private readonly incomeApi = inject(IncomeApiService);
  private readonly notificationsApi = inject(NotificationsApiService);
  private readonly session = inject(SessionService);

  users: UserProfile[] = [];
  notifications: AppNotification[] = [];
  userSpendMap = new Map<number, number>();
  userIncomeMap = new Map<number, number>();
  loading = true;
  sending = false;
  errorMessage = '';
  message = '';

  // platform-wide transactions
  activeTab: 'users' | 'expenses' | 'incomes' = 'users';
  allExpenses: { email: string; title: string; amount: number; date: string; category: string }[] = [];
  allIncomes: { email: string; title: string; amount: number; date: string; source: string }[] = [];
  transactionsLoaded = false;

  broadcastForm = {
    title: '',
    message: ''
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.message = '';
    this.errorMessage = '';

    forkJoin({
      users: this.authApi.getUsers().pipe(catchError(() => of([]))),
      notifications: this.notificationsApi.listAll().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ users, notifications }) => {
        this.users = users;
        this.notifications = notifications;
        this.loadSpendForUsers();
      },
      error: () => {
        this.errorMessage = 'Unable to load admin dashboard.';
        this.loading = false;
      }
    });
  }

  private loadSpendForUsers(): void {
    const now = new Date();
    const expenseRequests = this.users.map(user =>
      this.expensesApi.listByMonth(user.userId, now.getFullYear(), now.getMonth() + 1).pipe(catchError(() => of([])))
    );
    const incomeRequests = this.users.map(user =>
      this.incomeApi.listByMonth(user.userId, now.getFullYear(), now.getMonth() + 1).pipe(catchError(() => of([])))
    );

    if (!expenseRequests.length) {
      this.loading = false;
      return;
    }

    forkJoin([...expenseRequests, ...incomeRequests]).subscribe({
      next: results => {
        const half = this.users.length;
        results.slice(0, half).forEach((expenses, index) => {
          const total = expenses.reduce((sum, item) => sum + item.amount, 0);
          this.userSpendMap.set(this.users[index].userId, total);
        });
        results.slice(half).forEach((incomes, index) => {
          const total = incomes.reduce((sum, item) => sum + item.amount, 0);
          this.userIncomeMap.set(this.users[index].userId, total);
        });
      },
      complete: () => { this.loading = false; }
    });
  }

  // ── Stats ────────────────────────────────────────────────────

  get totalUsers(): number { return this.users.length; }
  get activeUsers(): number { return this.users.filter(u => u.isActive !== false).length; }
  get totalTransactions(): number { return this.notifications.length; }

  get platformTotalExpense(): number {
    return [...this.userSpendMap.values()].reduce((sum, v) => sum + v, 0);
  }

  get platformTotalIncome(): number {
    return [...this.userIncomeMap.values()].reduce((sum, v) => sum + v, 0);
  }

  get topSpender(): { email: string; amount: number } | null {
    if (!this.users.length) { return null; }
    let top = this.users[0];
    let topAmount = this.userSpendMap.get(top.userId) ?? 0;
    for (const user of this.users) {
      const amount = this.userSpendMap.get(user.userId) ?? 0;
      if (amount > topAmount) { top = user; topAmount = amount; }
    }
    return topAmount > 0 ? { email: top.email, amount: topAmount } : null;
  }

  get averageSpend(): number {
    if (!this.users.length) { return 0; }
    return this.platformTotalExpense / this.users.length;
  }

  get alertsToday(): number {
    const today = new Date().toDateString();
    return this.notifications.filter(item => new Date(item.createdAt).toDateString() === today).length;
  }

  get adminCount(): number { return this.users.filter(u => u.role === 'ADMIN').length; }

  monthlySpend(user: UserProfile): number {
    return this.userSpendMap.get(user.userId) ?? 0;
  }

  // ── Permanent delete ─────────────────────────────────────────

  deleteUser(user: UserProfile): void {
    if (user.userId === this.session.userId()) {
      this.errorMessage = 'You cannot delete your own account.';
      return;
    }
    if (!confirm(`PERMANENTLY DELETE ${user.email}? This cannot be undone and all their data will be lost.`)) {
      return;
    }
    this.authApi.deleteUser(user.userId).subscribe({
      next: () => {
        this.message = `✅ ${user.email} has been permanently deleted.`;
        this.loadData();
      },
      error: () => { this.errorMessage = `Failed to delete ${user.email}.`; }
    });
  }

  // ── Tab switching + platform transactions ─────────────────────

  switchTab(tab: 'users' | 'expenses' | 'incomes'): void {
    this.activeTab = tab;
    if ((tab === 'expenses' || tab === 'incomes') && !this.transactionsLoaded) {
      this.loadAllTransactions();
    }
  }

  private loadAllTransactions(): void {
    if (!this.users.length) { return; }

    const now = new Date();
    const expenseRequests = this.users.map(user =>
      this.expensesApi.listByUser(user.userId).pipe(
        catchError(() => of([])),
        // tag each expense with the user email
      )
    );
    const incomeRequests = this.users.map(user =>
      this.incomeApi.listByUser(user.userId).pipe(catchError(() => of([])))
    );

    forkJoin([...expenseRequests, ...incomeRequests]).subscribe({
      next: results => {
        const half = this.users.length;
        this.allExpenses = [];
        this.allIncomes = [];

        results.slice(0, half).forEach((expenses, index) => {
          const email = this.users[index].email;
          for (const e of expenses as any[]) {
            this.allExpenses.push({
              email,
              title: e.title,
              amount: e.amount,
              date: e.date,
              category: e.categoryId ?? '—'
            });
          }
        });

        results.slice(half).forEach((incomes, index) => {
          const email = this.users[index].email;
          for (const i of incomes as any[]) {
            this.allIncomes.push({
              email,
              title: i.title,
              amount: i.amount,
              date: i.date,
              source: i.source ?? '—'
            });
          }
        });

        // Sort by date descending
        this.allExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.allIncomes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.transactionsLoaded = true;
      }
    });
  }

  // ── Actions ──────────────────────────────────────────────────

  deactivate(user: UserProfile): void {
    if (!confirm(`Are you sure you want to deactivate ${user.email}?`)) {
      return;
    }
    this.authApi.deactivate(user.userId).subscribe({
      next: () => {
        this.message = `✅ ${user.email} has been deactivated.`;
        this.loadData();
      },
      error: () => {
        this.errorMessage = `Failed to deactivate ${user.email}.`;
      }
    });
  }

  // ✅ NEW — Reactivate a deactivated user
  reactivate(user: UserProfile): void {
    if (!confirm(`Are you sure you want to reactivate ${user.email}?`)) {
      return;
    }
    this.authApi.reactivate(user.userId).subscribe({
      next: () => {
        this.message = `✅ ${user.email} has been reactivated.`;
        this.loadData();
      },
      error: () => {
        this.errorMessage = `Failed to reactivate ${user.email}.`;
      }
    });
  }

  // ✅ NEW — Promote a user to ADMIN role
  promoteToAdmin(user: UserProfile): void {
    if (!confirm(`Promote ${user.email} to ADMIN? This gives them full admin access.`)) {
      return;
    }
    this.authApi.promote(user.userId).subscribe({
      next: () => {
        this.message = `✅ ${user.email} has been promoted to Admin.`;
        this.loadData();
      },
      error: () => {
        this.errorMessage = `Failed to promote ${user.email}.`;
      }
    });
  }

  // ── Broadcast ────────────────────────────────────────────────

  sendBroadcast(): void {
    if (!this.broadcastForm.title || !this.broadcastForm.message) {
      this.errorMessage = 'Please fill in both title and message before sending.';
      return;
    }

    this.sending = true;
    this.errorMessage = '';
    const userIds = this.users.map(user => user.userId);

    this.notificationsApi.sendBulk(userIds, this.broadcastForm.title, this.broadcastForm.message).subscribe({
      next: () => {
        this.message = '✅ Broadcast sent successfully to all users.';
        this.broadcastForm = { title: '', message: '' };
        this.loadData();
      },
      error: () => {
        this.errorMessage = 'Unable to send broadcast notification.';
      },
      complete: () => {
        this.sending = false;
      }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────

  formatAmount(amount: number): string {
    return formatCurrency(amount, this.session.profile()?.currency ?? 'INR');
  }

  isCurrentUser(user: UserProfile): boolean {
    return user.userId === this.session.userId();
  }
}