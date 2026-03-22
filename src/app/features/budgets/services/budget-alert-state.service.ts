import { Injectable, signal, inject } from '@angular/core';
import { BudgetService } from './budget.service';

/**
 * Lightweight singleton that holds the unread budget alert count.
 * Consumed by the Sidebar (badge) and BudgetListComponent (panel).
 * Refresh is triggered manually after mutations, not on a timer.
 */
@Injectable({ providedIn: 'root' })
export class BudgetAlertStateService {
  private budgetService = inject(BudgetService);

  readonly unreadCount = signal<number>(0);

  refresh(): void {
    this.budgetService.getAlerts().subscribe({
      next: (alerts) => this.unreadCount.set(alerts.length),
      error: () => { /* silently ignore — badge just won't show */ },
    });
  }

  decrement(): void {
    this.unreadCount.update(n => Math.max(0, n - 1));
  }

  reset(): void {
    this.unreadCount.set(0);
  }
}
