import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BudgetService } from '../services/budget.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { Budget } from '../../../core/models/budget.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-budget-list',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, CurrencyFormatPipe],
  template: `
    <div class="budget-list-page">
      <h1>Budgets</h1>
      <div *ngIf="isLoading()" class="loading-container">
        <app-loading-spinner></app-loading-spinner>
      </div>
      <div *ngIf="!isLoading()" class="budgets">
        <div *ngFor="let budget of budgets()" class="budget-card">
          <div class="budget-header">
            <h3>{{ budget.category?.name }}</h3>
            <span class="budget-period">{{ budget.period }}</span>
          </div>
          <div class="budget-amount">
            {{ budget.amount | currencyFormat:currency() }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .budget-list-page {
        padding: var(--spacing-lg);
      }

      .budgets {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--spacing-md);
      }

      .budget-card {
        background: var(--bg-color);
        border-radius: var(--border-radius);
        padding: var(--spacing-lg);
        box-shadow: var(--shadow-sm);
      }

      .budget-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-md);
      }

      .budget-period {
        font-size: 0.875rem;
        color: var(--text-secondary);
        text-transform: capitalize;
      }

      .budget-amount {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--primary-color);
      }
    `,
  ],
})
export class BudgetListComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private authService = inject(AuthService);

  isLoading = signal(false);
  budgets = signal<Budget[]>([]);
  currency = signal(this.authService.currentUser()?.currency || 'USD');

  ngOnInit(): void {
    this.loadBudgets();
  }

  loadBudgets(): void {
    this.isLoading.set(true);
    this.budgetService.getAll().subscribe({
      next: (budgets) => {
        this.budgets.set(budgets);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading budgets:', error);
        this.isLoading.set(false);
      },
    });
  }
}

