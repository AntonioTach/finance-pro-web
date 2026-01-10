import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TransactionService } from '../services/transaction.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { Transaction } from '../../../core/models/transaction.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LoadingSpinnerComponent,
    CurrencyFormatPipe,
    DateFormatPipe,
  ],
  template: `
    <div class="transaction-list-page">
      <div class="page-header">
        <h1>Transactions</h1>
        <button routerLink="/transactions/new" class="btn-primary">Add Transaction</button>
      </div>

      <div *ngIf="isLoading()" class="loading-container">
        <app-loading-spinner></app-loading-spinner>
      </div>

      <div *ngIf="!isLoading() && transactions().length === 0" class="empty-state">
        No transactions found
      </div>

      <div *ngIf="!isLoading() && transactions().length > 0" class="transactions">
        <div *ngFor="let transaction of transactions()" class="transaction-card">
          <div class="transaction-header">
            <span class="category-icon">{{ transaction.category?.icon || '💰' }}</span>
            <div class="transaction-details">
              <h3>{{ transaction.description }}</h3>
              <p class="transaction-meta">
                {{ transaction.date | dateFormat }} • {{ transaction.category?.name }}
              </p>
            </div>
            <div class="transaction-amount" [class.income]="transaction.type === 'income'" [class.expense]="transaction.type === 'expense'">
              {{ transaction.type === 'income' ? '+' : '-' }}{{ transaction.amount | currencyFormat:currency() }}
            </div>
          </div>
          <div *ngIf="transaction.notes" class="transaction-notes">
            {{ transaction.notes }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .transaction-list-page {
        padding: var(--spacing-lg);
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-lg);
      }

      .transaction-card {
        background: var(--bg-color);
        border-radius: var(--border-radius);
        padding: var(--spacing-lg);
        margin-bottom: var(--spacing-md);
        box-shadow: var(--shadow-sm);
      }

      .transaction-header {
        display: flex;
        gap: var(--spacing-md);
        align-items: center;
      }

      .category-icon {
        font-size: 2rem;
      }

      .transaction-details {
        flex: 1;
      }

      .transaction-details h3 {
        margin: 0 0 var(--spacing-xs) 0;
      }

      .transaction-meta {
        color: var(--text-secondary);
        font-size: 0.875rem;
        margin: 0;
      }

      .transaction-amount {
        font-size: 1.25rem;
        font-weight: 600;
      }

      .transaction-amount.income {
        color: var(--success-color);
      }

      .transaction-amount.expense {
        color: var(--danger-color);
      }

      .transaction-notes {
        margin-top: var(--spacing-md);
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--border-color);
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
export class TransactionListComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private authService = inject(AuthService);

  isLoading = signal(false);
  transactions = signal<Transaction[]>([]);
  currency = signal(this.authService.currentUser()?.currency || 'USD');

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.isLoading.set(true);
    this.transactionService.getAll().subscribe({
      next: (transactions) => {
        this.transactions.set(transactions);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.isLoading.set(false);
      },
    });
  }
}

