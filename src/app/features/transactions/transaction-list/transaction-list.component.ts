import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { TransactionService } from '../services/transaction.service';
import { TransactionFormComponent } from '../transaction-form/transaction-form.component';
import { AppDialogService } from '../../../shared/services/dialog.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { Transaction } from '../../../core/models/transaction.model';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule,
    TooltipModule,
    LoadingSpinnerComponent,
    CurrencyFormatPipe,
    DateFormatPipe,
    TranslatePipe,
  ],
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss'],
})
export class TransactionListComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private authService = inject(AuthService);
  private dialogService = inject(AppDialogService);
  private messageService = inject(MessageService);
  private ts = inject(TranslationService);

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
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.ts.t('transactions.error.load'),
        });
      },
    });
  }

  openAddDialog(): void {
    const ref = this.dialogService.open(TransactionFormComponent, {
      header: this.ts.t('transactions.dialogNew'),
      width: '500px',
    });

    ref.onClose.subscribe((result: Transaction | undefined) => {
      if (result) {
        this.loadTransactions();
        this.messageService.add({
          severity: 'success',
          summary: this.ts.t('transactions.success.created'),
        });
      }
    });
  }

  openEditDialog(transaction: Transaction): void {
    const ref = this.dialogService.open(TransactionFormComponent, {
      header: this.ts.t('transactions.dialogEdit'),
      width: '500px',
      data: { transaction },
    });

    ref.onClose.subscribe((result: Transaction | undefined) => {
      if (result) {
        this.loadTransactions();
        this.messageService.add({
          severity: 'success',
          summary: this.ts.t('transactions.success.updated'),
        });
      }
    });
  }

  confirmDelete(transaction: Transaction): void {
    this.dialogService
      .confirm({
        title: this.ts.t('transactions.deleteTitle'),
        message: this.ts.t('transactions.deleteMsg'),
        acceptLabel: this.ts.t('transactions.deleteAccept'),
        rejectLabel: this.ts.t('common.cancel'),
        severity: 'danger',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.deleteTransaction(transaction);
        }
      });
  }

  private deleteTransaction(transaction: Transaction): void {
    this.transactionService.delete(transaction.id).subscribe({
      next: () => {
        this.loadTransactions();
        this.messageService.add({
          severity: 'success',
          summary: this.ts.t('transactions.success.deleted'),
        });
      },
      error: (error) => {
        console.error('Error deleting transaction:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.ts.t('transactions.error.delete'),
        });
      },
    });
  }

  getTransactionSeverity(type: string): 'success' | 'danger' | 'info' | 'warn' {
    switch (type) {
      case 'income':       return 'success';
      case 'expense':      return 'danger';
      case 'card_purchase': return 'warn';
      case 'card_payment':  return 'info';
      default:             return 'danger';
    }
  }
}
