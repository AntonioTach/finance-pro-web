import { Component, inject, signal, OnInit, computed } from '@angular/core';
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
import { ReportService } from '../services/report.service';
import { CategoryService } from '../../categories/services/category.service';
import { CardService } from '../../cards/services/card.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { Transaction, TransactionType } from '../../../core/models/transaction.model';
import { TransactionReportFilters } from '../../../core/models/report.model';
import { Category } from '../../../core/models/category.model';
import { Card } from '../../../core/models/card.model';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface SelectOption {
  label: string;
  value: string | null;
}

@Component({
  selector: 'app-transaction-report',
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
    LoadingSpinnerComponent,
    CurrencyFormatPipe,
    DateFormatPipe,
  ],
  templateUrl: './transaction-report.component.html',
  styleUrls: ['./transaction-report.component.scss'],
})
export class TransactionReportComponent implements OnInit {
  private reportService = inject(ReportService);
  private categoryService = inject(CategoryService);
  private cardService = inject(CardService);
  private authService = inject(AuthService);

  isLoading = signal(false);
  transactions = signal<Transaction[]>([]);
  categories = signal<Category[]>([]);
  cards = signal<Card[]>([]);
  currency = computed(() => this.authService.currentUser()?.currency || 'USD');

  // Filter values
  startDate: Date | null = startOfMonth(subMonths(new Date(), 2));
  endDate: Date | null = endOfMonth(new Date());
  selectedType: TransactionType | null = null;
  selectedCategoryId: string | null = null;
  selectedCardId: string | null = null;
  minAmount: number | null = null;
  maxAmount: number | null = null;
  searchTerm = '';

  transactionTypes: SelectOption[] = [
    { label: 'Income', value: TransactionType.INCOME },
    { label: 'Expense', value: TransactionType.EXPENSE },
    { label: 'Card Purchase', value: TransactionType.CARD_PURCHASE },
    { label: 'Card Payment', value: TransactionType.CARD_PAYMENT },
  ];

  categoryOptions = computed((): SelectOption[] => {
    return this.categories().map((c) => ({
      label: c.name,
      value: c.id,
    }));
  });

  cardOptions = computed((): SelectOption[] => {
    return this.cards().map((c) => ({
      label: c.name,
      value: c.id,
    }));
  });

  totalIncome = computed(() => {
    return this.transactions()
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  });

  totalExpenses = computed(() => {
    return this.transactions()
      .filter((t) => t.type === TransactionType.EXPENSE || t.type === TransactionType.CARD_PURCHASE || t.type === TransactionType.CARD_PAYMENT)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  });

  netBalance = computed(() => this.totalIncome() - this.totalExpenses());

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.categoryService.getAll().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (err) => console.error('Error loading categories:', err),
    });

    this.cardService.getAll().subscribe({
      next: (cards) => this.cards.set(cards),
      error: (err) => console.error('Error loading cards:', err),
    });

    this.loadTransactions();
  }

  loadTransactions(): void {
    this.isLoading.set(true);

    const filters: TransactionReportFilters = {};

    if (this.startDate) {
      filters.startDate = format(this.startDate, 'yyyy-MM-dd');
    }
    if (this.endDate) {
      filters.endDate = format(this.endDate, 'yyyy-MM-dd');
    }
    if (this.selectedType) {
      filters.type = this.selectedType;
    }
    if (this.selectedCategoryId) {
      filters.categoryId = this.selectedCategoryId;
    }
    if (this.selectedCardId) {
      filters.cardId = this.selectedCardId;
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

    this.reportService.generateTransactionReport(filters).subscribe({
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

  applyFilters(): void {
    this.loadTransactions();
  }

  clearFilters(): void {
    this.startDate = startOfMonth(subMonths(new Date(), 2));
    this.endDate = endOfMonth(new Date());
    this.selectedType = null;
    this.selectedCategoryId = null;
    this.selectedCardId = null;
    this.minAmount = null;
    this.maxAmount = null;
    this.searchTerm = '';
    this.loadTransactions();
  }

  exportToCsv(): void {
    const data = this.transactions();
    if (!data.length) return;

    const headers = ['Date', 'Description', 'Category', 'Type', 'Card', 'Amount', 'Notes'];
    const rows = data.map((t) => [
      t.date,
      `"${t.description}"`,
      t.category?.name || 'Uncategorized',
      t.type,
      t.card?.name || '',
      t.type === TransactionType.INCOME ? Number(t.amount || 0) : -Number(t.amount || 0),
      `"${t.notes || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
      [TransactionType.CARD_PURCHASE]: 'Card',
      [TransactionType.CARD_PAYMENT]: 'Payment',
    };
    return labels[type] || type;
  }

  getTypeSeverity(type: TransactionType): 'success' | 'danger' | 'info' | 'warn' {
    if (type === TransactionType.INCOME) return 'success';
    if (type === TransactionType.CARD_PAYMENT) return 'info';
    return 'danger';
  }
}
