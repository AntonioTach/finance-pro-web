import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { CashFlowService, CashFlowSummary, CashFlowFilters } from './services/cash-flow.service';
import { CategoryService } from '../categories/services/category.service';
import { AuthService } from '../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { CategoryIconComponent } from '../../shared/components/category-icon/category-icon.component';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { DateFormatPipe } from '../../shared/pipes/date-format.pipe';
import { Transaction, TransactionType } from '../../core/models/transaction.model';
import { Category } from '../../core/models/category.model';
import { ReportPeriod } from '../../core/models/report.model';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface SelectOption {
  label: string;
  value: string | null;
}

@Component({
  selector: 'app-cash-flow',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    DatePickerModule,
    SelectModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    TableModule,
    TagModule,
    TooltipModule,
    BaseChartDirective,
    LoadingSpinnerComponent,
    CategoryIconComponent,
    CurrencyFormatPipe,
    DateFormatPipe,
  ],
  templateUrl: './cash-flow.component.html',
  styleUrls: ['./cash-flow.component.scss'],
})
export class CashFlowComponent implements OnInit {
  private cashFlowService = inject(CashFlowService);
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);

  isLoading = signal(false);
  summary = signal<CashFlowSummary | null>(null);
  transactions = signal<Transaction[]>([]);
  categories = signal<Category[]>([]);
  availableCash = signal<number>(0);
  currency = computed(() => this.authService.currentUser()?.currency || 'USD');

  // Filter values
  startDate: Date | null = startOfMonth(subMonths(new Date(), 2));
  endDate: Date | null = endOfMonth(new Date());
  selectedCategoryId: string | null = null;
  minAmount: number | null = null;
  maxAmount: number | null = null;
  searchTerm = '';

  categoryOptions = computed((): SelectOption[] => {
    return this.categories().map((c) => ({
      label: c.name,
      value: c.id,
    }));
  });

  // Chart configuration
  trendChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: true, position: 'top', labels: { usePointStyle: true, padding: 15 } },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: $${Number(ctx.raw || 0).toLocaleString()}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { callback: (v) => '$' + Number(v).toLocaleString() },
      },
      x: { grid: { display: false } },
    },
  };

  trendChartData = signal<ChartData<'line'>>({
    labels: [],
    datasets: [],
  });

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.categoryService.getAll().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (err) => console.error('Error loading categories:', err),
    });

    this.loadAvailableCash();
    this.loadCashFlowData();
    this.loadTrendChart();
  }

  loadAvailableCash(): void {
    this.cashFlowService.getAvailableCash().subscribe({
      next: (cash) => this.availableCash.set(cash),
      error: (err) => console.error('Error loading available cash:', err),
    });
  }

  loadCashFlowData(): void {
    this.isLoading.set(true);

    const filters: CashFlowFilters = {
      startDate: this.startDate ? format(this.startDate, 'yyyy-MM-dd') : '',
      endDate: this.endDate ? format(this.endDate, 'yyyy-MM-dd') : '',
    };

    if (this.selectedCategoryId) {
      filters.categoryId = this.selectedCategoryId;
    }
    if (this.minAmount !== null) {
      filters.minAmount = this.minAmount;
    }
    if (this.maxAmount !== null) {
      filters.maxAmount = this.maxAmount;
    }
    if (this.searchTerm.trim()) {
      filters.searchTerm = this.searchTerm.trim();
    }

    // Load summary
    this.cashFlowService.getCashFlowSummary(filters).subscribe({
      next: (summary) => this.summary.set(summary),
      error: (err) => console.error('Error loading summary:', err),
    });

    // Load transactions
    this.cashFlowService.getCashTransactions(filters).subscribe({
      next: (transactions) => {
        this.transactions.set(transactions);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading transactions:', err);
        this.isLoading.set(false);
      },
    });
  }

  loadTrendChart(): void {
    this.cashFlowService.getCashFlowTrend(ReportPeriod.MONTHLY, 6).subscribe({
      next: (dataPoints) => {
        this.trendChartData.set({
          labels: dataPoints.map((p) => p.label),
          datasets: [
            {
              label: 'Income',
              data: dataPoints.map((p) => Number(p.income || 0)),
              borderColor: '#22c55e',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
            {
              label: 'Expenses',
              data: dataPoints.map((p) => Number(p.expenses || 0)),
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
            {
              label: 'Net Cash Flow',
              data: dataPoints.map((p) => Number(p.balance || 0)),
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        });
      },
      error: (err) => console.error('Error loading trend chart:', err),
    });
  }

  applyFilters(): void {
    this.loadCashFlowData();
  }

  clearFilters(): void {
    this.startDate = startOfMonth(subMonths(new Date(), 2));
    this.endDate = endOfMonth(new Date());
    this.selectedCategoryId = null;
    this.minAmount = null;
    this.maxAmount = null;
    this.searchTerm = '';
    this.loadCashFlowData();
  }

  exportToCsv(): void {
    const data = this.transactions();
    if (!data.length) return;

    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Notes'];
    const rows = data.map((t) => [
      t.date,
      `"${t.description}"`,
      t.category?.name || 'Uncategorized',
      t.type,
      t.type === TransactionType.INCOME ? Number(t.amount || 0) : -Number(t.amount || 0),
      `"${t.notes || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cash-flow_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
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

  getTypeLabel(type: TransactionType): string {
    const labels: Record<TransactionType, string> = {
      [TransactionType.INCOME]: 'Income',
      [TransactionType.EXPENSE]: 'Expense',
      [TransactionType.CARD_PURCHASE]: 'Card Purchase',
      [TransactionType.CARD_PAYMENT]: 'Card Payment',
    };
    return labels[type] || type;
  }

  getTypeSeverity(type: TransactionType): 'success' | 'danger' | 'info' | 'warn' {
    if (type === TransactionType.INCOME) return 'success';
    if (type === TransactionType.CARD_PAYMENT) return 'info';
    return 'danger';
  }

  getTypeIcon(type: TransactionType): string {
    switch (type) {
      case TransactionType.INCOME:
        return 'pi-arrow-down-left';
      case TransactionType.EXPENSE:
        return 'pi-arrow-up-right';
      case TransactionType.CARD_PAYMENT:
        return 'pi-wallet';
      default:
        return 'pi-money-bill';
    }
  }
}
