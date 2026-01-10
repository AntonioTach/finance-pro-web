import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TransactionService } from '../transactions/services/transaction.service';
import { CategoryService } from '../categories/services/category.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { DateFormatPipe } from '../../shared/pipes/date-format.pipe';
import { AuthService } from '../../core/services/auth.service';
import { Transaction } from '../../core/models/transaction.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LoadingSpinnerComponent,
    CurrencyFormatPipe,
    DateFormatPipe,
  ],
  template: `
    <div class="dashboard">
      <div class="dashboard-header">
        <h1>Dashboard</h1>
        <button routerLink="/transactions/new" class="btn-primary">Add Transaction</button>
      </div>

      <div class="dashboard-grid">
        <div class="card summary-card">
          <h2>Balance Summary</h2>
          <div class="summary-item">
            <span class="label">Income:</span>
            <span class="value income">{{ summary()?.income | currencyFormat:currency() }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Expense:</span>
            <span class="value expense">{{ summary()?.expense | currencyFormat:currency() }}</span>
          </div>
          <div class="summary-item total">
            <span class="label">Balance:</span>
            <span class="value" [class.positive]="summary()?.balance >= 0" [class.negative]="summary()?.balance < 0">
              {{ summary()?.balance | currencyFormat:currency() }}
            </span>
          </div>
        </div>

        <div class="card">
          <h2>Recent Transactions</h2>
          <div *ngIf="isLoading()" class="loading-container">
            <app-loading-spinner></app-loading-spinner>
          </div>
          <div *ngIf="!isLoading() && recentTransactions().length === 0" class="empty-state">
            No transactions yet
          </div>
          <ul *ngIf="!isLoading() && recentTransactions().length > 0" class="transaction-list">
            <li *ngFor="let transaction of recentTransactions()" class="transaction-item">
              <div class="transaction-info">
                <span class="transaction-icon">{{ transaction.category?.icon || '💰' }}</span>
                <div>
                  <div class="transaction-description">{{ transaction.description }}</div>
                  <div class="transaction-meta">
                    {{ transaction.date | dateFormat:'MMM dd' }} • {{ transaction.category?.name }}
                  </div>
                </div>
              </div>
              <div class="transaction-amount" [class.income]="transaction.type === 'income'" [class.expense]="transaction.type === 'expense'">
                {{ transaction.type === 'income' ? '+' : '-' }}{{ transaction.amount | currencyFormat:currency() }}
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard {
        padding: var(--spacing-lg);
      }

      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-lg);
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--spacing-lg);
      }

      .card {
        background: var(--bg-color);
        border-radius: var(--border-radius);
        padding: var(--spacing-lg);
        box-shadow: var(--shadow-sm);
      }

      .card h2 {
        margin-bottom: var(--spacing-md);
        font-size: 1.25rem;
      }

      .summary-card .summary-item {
        display: flex;
        justify-content: space-between;
        padding: var(--spacing-md) 0;
        border-bottom: 1px solid var(--border-color);
      }

      .summary-item.total {
        border-bottom: none;
        font-weight: 600;
        font-size: 1.1rem;
        margin-top: var(--spacing-sm);
      }

      .value.income {
        color: var(--success-color);
      }

      .value.expense {
        color: var(--danger-color);
      }

      .value.positive {
        color: var(--success-color);
      }

      .value.negative {
        color: var(--danger-color);
      }

      .transaction-list {
        list-style: none;
        padding: 0;
      }

      .transaction-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-md);
        border-bottom: 1px solid var(--border-color);
      }

      .transaction-info {
        display: flex;
        gap: var(--spacing-md);
        align-items: center;
      }

      .transaction-icon {
        font-size: 1.5rem;
      }

      .transaction-description {
        font-weight: 500;
      }

      .transaction-meta {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .transaction-amount {
        font-weight: 600;
      }

      .transaction-amount.income {
        color: var(--success-color);
      }

      .transaction-amount.expense {
        color: var(--danger-color);
      }

      .loading-container,
      .empty-state {
        text-align: center;
        padding: var(--spacing-xl);
        color: var(--text-secondary);
      }

      .btn-primary {
        background-color: var(--primary-color);
        color: white;
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--border-radius-sm);
        font-weight: 500;
      }
    `,
  ],
})
export class DashboardComponent {
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);

  isLoading = signal(false);
  summary = signal<any>(null);
  recentTransactions = signal<Transaction[]>([]);
  currency = computed(() => this.authService.currentUser()?.currency || 'USD');

  constructor() {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    this.transactionService.getSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
      },
      error: (error) => {
        console.error('Error loading summary:', error);
      },
    });

    this.transactionService.getAll().subscribe({
      next: (transactions) => {
        this.recentTransactions.set(transactions.slice(0, 10));
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.isLoading.set(false);
      },
    });
  }
}

