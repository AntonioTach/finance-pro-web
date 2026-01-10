import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
    canActivate: [noAuthGuard],
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then(
        (m) => m.DASHBOARD_ROUTES,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'transactions',
    loadChildren: () =>
      import('./features/transactions/transactions.routes').then(
        (m) => m.TRANSACTION_ROUTES,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'categories',
    loadChildren: () =>
      import('./features/categories/categories.routes').then(
        (m) => m.CATEGORY_ROUTES,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'budgets',
    loadChildren: () =>
      import('./features/budgets/budgets.routes').then(
        (m) => m.BUDGET_ROUTES,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'reports',
    loadChildren: () =>
      import('./features/reports/reports.routes').then(
        (m) => m.REPORT_ROUTES,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadChildren: () =>
      import('./features/profile/profile.routes').then(
        (m) => m.PROFILE_ROUTES,
      ),
    canActivate: [authGuard],
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' },
];

