import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { ReportService } from '../services/report.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { CategoryIconComponent } from '../../../shared/components/category-icon/category-icon.component';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { OverviewReport } from '../../../core/models/report.model';
import { TransactionType } from '../../../core/models/transaction.model';

@Component({
  selector: 'app-overview-report',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    TagModule,
    ProgressBarModule,
    TooltipModule,
    LoadingSpinnerComponent,
    CurrencyFormatPipe,
    CategoryIconComponent,
    DateFormatPipe,
  ],
  templateUrl: './overview-report.component.html',
  styleUrls: ['./overview-report.component.scss'],
})
export class OverviewReportComponent implements OnInit {
  private reportService = inject(ReportService);
  private authService = inject(AuthService);

  isLoading = signal(false);
  report = signal<OverviewReport | null>(null);
  currency = computed(() => this.authService.currentUser()?.currency || 'USD');

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.isLoading.set(true);
    this.reportService.generateOverviewReport().subscribe({
      next: (report) => {
        this.report.set(report);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading overview report:', error);
        this.isLoading.set(false);
      },
    });
  }

  formatCurrency(value: number | undefined | null): string {
    if (value === undefined || value === null || isNaN(value)) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.currency(),
      }).format(0);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency(),
    }).format(value);
  }

  formatNumber(value: number | undefined | null): string {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.0';
    }
    return value.toFixed(1);
  }

  formatPercentage(value: number | undefined | null): string {
    if (value === undefined || value === null || isNaN(value)) {
      return '0%';
    }
    return `${Math.abs(value).toFixed(1)}%`;
  }

  getIncomeChange(): number {
    return this.report()?.incomeChange ?? 0;
  }

  getExpenseChange(): number {
    return this.report()?.expenseChange ?? 0;
  }

  getBalance(): number {
    return this.report()?.summary?.balance ?? 0;
  }

  getBalanceChange(): number {
    return this.report()?.balanceChange ?? 0;
  }

  getTransactionTypeLabel(type: TransactionType): string {
    const labels: Record<TransactionType, string> = {
      [TransactionType.INCOME]: 'Income',
      [TransactionType.EXPENSE]: 'Expense',
      [TransactionType.CARD_PURCHASE]: 'Card',
      [TransactionType.CARD_PAYMENT]: 'Payment',
    };
    return labels[type] || type;
  }

  getTransactionSeverity(type: TransactionType): 'success' | 'danger' | 'info' | 'warn' {
    if (type === TransactionType.INCOME) return 'success';
    if (type === TransactionType.CARD_PAYMENT) return 'info';
    return 'danger';
  }
}
