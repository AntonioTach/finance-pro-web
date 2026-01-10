import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TransactionService } from '../transactions/services/transaction.service';
import { TransactionFormComponent } from '../transactions/transaction-form/transaction-form.component';
import { AppDialogService } from '../../shared/services/dialog.service';
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
    ButtonModule,
    CardModule,
    ToastModule,
    LoadingSpinnerComponent,
    CurrencyFormatPipe,
    DateFormatPipe,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  private transactionService = inject(TransactionService);
  private authService = inject(AuthService);
  private dialogService = inject(AppDialogService);
  private messageService = inject(MessageService);

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

  openAddDialog(): void {
    const ref = this.dialogService.open(TransactionFormComponent, {
      header: 'New Transaction',
      width: '500px',
    });

    ref.onClose.subscribe((result: Transaction | undefined) => {
      if (result) {
        this.loadData();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Transaction created successfully',
        });
      }
    });
  }
}
