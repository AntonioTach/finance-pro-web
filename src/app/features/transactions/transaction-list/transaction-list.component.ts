import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { forkJoin, merge, switchMap } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, skip } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { TransactionService } from '../services/transaction.service';
import { ReportService } from '../../reports/services/report.service';
import { TransactionFormComponent } from '../transaction-form/transaction-form.component';
import { TransactionFiltersComponent } from '../transaction-filters/transaction-filters.component';
import { TransactionAnalyticsComponent } from '../transaction-analytics/transaction-analytics.component';
import { AppDialogService } from '../../../shared/services/dialog.service';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { Transaction } from '../../../core/models/transaction.model';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { FinancialSummary, CategoryBreakdown, TimeSeriesDataPoint } from '../../../core/models/report.model';
import {
  TransactionListFilters,
  DEFAULT_TRANSACTION_FILTERS,
  AnalyticsFilters,
  toAnalyticsFilters,
} from '../models/transaction-list-filters.model';
import { resolveTrendGranularity } from '../transaction-analytics/trend-granularity.util';

interface TableLazyLoadState {
  first?: number | null;
  rows?: number | null;
  sortField?: string | string[] | null;
  sortOrder?: number | null;
}

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
    CurrencyFormatPipe,
    DateFormatPipe,
    TranslatePipe,
    TransactionFiltersComponent,
    TransactionAnalyticsComponent,
  ],
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss'],
})
export class TransactionListComponent {
  private transactionService = inject(TransactionService);
  private reportService = inject(ReportService);
  private authService = inject(AuthService);
  private dialogService = inject(AppDialogService);
  private messageService = inject(MessageService);
  private ts = inject(TranslationService);

  currency = signal(this.authService.currentUser()?.currency || 'USD');

  filters = signal<TransactionListFilters>(DEFAULT_TRANSACTION_FILTERS);
  analyticsFilters = computed<AnalyticsFilters>(() => toAnalyticsFilters(this.filters()));
  granularity = computed(() =>
    resolveTrendGranularity(this.analyticsFilters().startDate, this.analyticsFilters().endDate),
  );

  isTableLoading = signal(false);
  transactions = signal<Transaction[]>([]);
  totalRecords = signal(0);

  isAnalyticsLoading = signal(false);
  summary = signal<FinancialSummary | null>(null);
  categoryBreakdown = signal<CategoryBreakdown[]>([]);
  trend = signal<Omit<TimeSeriesDataPoint, 'label'>[]>([]);

  /** Bumped after create/update/delete to force both pipelines below to refetch
   * even though `filters` itself didn't change. */
  private refreshTick = signal(0);

  constructor() {
    // The table cares about every field (including page/sort), so no equality
    // filtering is needed there — a manual refresh just re-emits the current value.
    const tableRefresh$ = toObservable(this.refreshTick).pipe(
      skip(1),
      map(() => this.filters()),
    );

    merge(toObservable(this.filters), tableRefresh$)
      .pipe(
        switchMap((filters) => {
          this.isTableLoading.set(true);
          return this.transactionService.getPage(filters);
        }),
      )
      .subscribe({
        next: (page) => {
          this.transactions.set(page.items);
          this.totalRecords.set(page.total);
          this.isTableLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading transactions:', error);
          this.isTableLoading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: this.ts.t('transactions.error.load'),
          });
        },
      });

    // analyticsFilters is a computed() over `filters` — it re-evaluates (with a new
    // object reference) on every table-only page/sort change too, so it needs its
    // own equality check; a manual refresh bypasses that check on purpose.
    const analyticsFilters$ = toObservable(this.analyticsFilters).pipe(
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    );
    const analyticsRefresh$ = toObservable(this.refreshTick).pipe(
      skip(1),
      map(() => this.analyticsFilters()),
    );

    merge(analyticsFilters$, analyticsRefresh$)
      .pipe(
        debounceTime(150),
        switchMap((filters) => {
          this.isAnalyticsLoading.set(true);
          const granularity = resolveTrendGranularity(filters.startDate, filters.endDate);
          return forkJoin([
            this.reportService.getMonthlyReport(filters),
            this.reportService.getByCategory(filters),
            this.reportService.getTrends({ ...filters, granularity }),
          ]);
        }),
      )
      .subscribe({
        next: ([monthly, categories, trend]) => {
          this.summary.set(monthly.summary);
          this.categoryBreakdown.set(categories);
          this.trend.set(trend);
          this.isAnalyticsLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading transaction analytics:', error);
          this.isAnalyticsLoading.set(false);
        },
      });
  }

  onFiltersChange(partial: Partial<AnalyticsFilters>): void {
    this.filters.update((current) => ({ ...current, ...partial, page: 1 }));
  }

  onLazyLoad(event: TableLazyLoadState): void {
    const rows = event.rows ?? this.filters().limit;
    const page = rows ? Math.floor((event.first ?? 0) / rows) + 1 : 1;
    const sortField = Array.isArray(event.sortField) ? event.sortField[0] : event.sortField;
    const sortOrder = event.sortOrder === 1 ? 'ASC' : 'DESC';
    const sortBy = (sortField as TransactionListFilters['sortBy']) ?? this.filters().sortBy;

    const current = this.filters();
    // PrimeNG fires onLazyLoad once automatically on mount with values that
    // already match the initial filters — skip the no-op update so mount
    // doesn't fire two identical requests.
    if (current.page === page && current.limit === rows && current.sortBy === sortBy && current.sortOrder === sortOrder) {
      return;
    }

    this.filters.set({ ...current, page, limit: rows, sortBy, sortOrder });
  }

  openAddDialog(): void {
    const ref = this.dialogService.open(TransactionFormComponent, {
      header: this.ts.t('transactions.dialogNew'),
      width: '500px',
    });

    ref.onClose.subscribe((result: Transaction | undefined) => {
      if (result) {
        this.refreshTick.update((n) => n + 1);
        this.messageService.add({
          severity: 'success',
          summary: this.ts.t('transactions.success.created'),
        });
      }
    });
  }

  openEditDialog(transaction: Transaction): void {
    const ref = this.dialogService.open<Transaction | { cancelled: true; deletedCount?: number }>(
      TransactionFormComponent,
      {
        header: this.ts.t('transactions.dialogEdit'),
        width: '500px',
        data: { transaction },
      },
    );

    ref.onClose.subscribe((result) => {
      if (!result) return;

      this.refreshTick.update((n) => n + 1);

      if ('cancelled' in result) {
        this.messageService.add({
          severity: 'success',
          summary: 'MSI cancelado',
          detail: `Se eliminaron ${result.deletedCount ?? 0} parcialidades pendientes.`,
        });
      } else {
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
        this.refreshTick.update((n) => n + 1);
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

  isMsi(transaction: Transaction): boolean {
    return !!(transaction.installmentMonths && transaction.installmentMonths > 0);
  }

  getMsiProgress(transaction: Transaction): number {
    if (!transaction.installmentMonths || !transaction.installmentCurrent) return 0;
    return Math.round((transaction.installmentCurrent / transaction.installmentMonths) * 100);
  }

  getMsiLabel(transaction: Transaction): string {
    if (!transaction.installmentMonths) return '';
    if (transaction.installmentCurrent) {
      return `${transaction.installmentCurrent}/${transaction.installmentMonths}`;
    }
    return `${transaction.installmentMonths} meses`;
  }

  getTransactionSeverity(type: string): 'success' | 'danger' | 'info' | 'warn' {
    switch (type) {
      case 'income':
        return 'success';
      case 'expense':
        return 'danger';
      case 'card_purchase':
        return 'warn';
      case 'card_payment':
        return 'info';
      default:
        return 'danger';
    }
  }
}
