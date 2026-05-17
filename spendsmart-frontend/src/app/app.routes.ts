import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { AuthComponent } from './pages/auth/auth';

export const routes: Routes = [
  {
    path: '',
    component: AuthComponent  // Login / Register page
  },

  {
    path: 'app',
    component: MainLayoutComponent,  // The sidebar + header shell
    canActivate: [authGuard],        // Blocks unauthenticated users
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./pages/analytics/analytics').then(m => m.AnalyticsComponent)
      },
      {
        path: 'expenses',
        loadComponent: () => import('./pages/expenses/expenses').then(m => m.ExpensesComponent)
      },
      {
        path: 'income',
        loadComponent: () => import('./pages/income/income').then(m => m.IncomeComponent)
      },
      {
        path: 'recurring',
        loadComponent: () => import('./pages/recurring/recurring').then(m => m.RecurringComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./pages/categories/categories').then(m => m.CategoriesComponent)
      },
      {
        path: 'budgets',
        loadComponent: () => import('./pages/budgets/budgets').then(m => m.BudgetsComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/reports').then(m => m.ReportsComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./pages/notifications/notifications').then(m => m.NotificationsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile').then(m => m.ProfileComponent)
      },

      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/admin/admin').then(m => m.AdminComponent)
      }
    ]
  },

  { path: '**', redirectTo: '' }
];