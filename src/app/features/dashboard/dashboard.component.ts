import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TransactionService } from '../transactions/services/transaction.service';
import { CardService } from '../cards/services/card.service';
import { SubscriptionService } from '../subscriptions/services/subscription.service';
import { ReportService } from '../reports/services/report.service';
import { BudgetService } from '../budgets/services/budget.service';
import { BudgetDashboard } from '../../core/models/budget.model';
import { TransactionFormComponent } from '../transactions/transaction-form/transaction-form.component';
import { AppDialogService } from '../../shared/services/dialog.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { DateFormatPipe } from '../../shared/pipes/date-format.pipe';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { Transaction, TransactionType } from '../../core/models/transaction.model';
import { Card, CardType } from '../../core/models/card.model';
import { Subscription } from '../../core/models/subscription.model';
import { ReportPeriod } from '../../core/models/report.model';
import { format, differenceInDays, addDays, setDate, addMonths, isBefore } from 'date-fns';

interface DashboardSummary {
  income: number;
  expenses: number;
  balance: number;
  incomeChange: number;
  expenseChange: number;
  transactionCount: number;
}

interface CashFlowSummary {
  income: number;
  expenses: number;
  balance: number;
  incomeChange: number;
  expenseChange: number;
}

interface UpcomingPayment {
  name: string;
  amount: number;
  dueDate: string;
  daysUntil: number;
  category?: string;
  categoryColor?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    CardModule,
    ToastModule,
    TooltipModule,
    ProgressBarModule,
    AvatarModule,
    TagModule,
    BaseChartDirective,
    LoadingSpinnerComponent,
    CurrencyFormatPipe,
    DateFormatPipe,
    TranslatePipe,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private cardService = inject(CardService);
  private subscriptionService = inject(SubscriptionService);
  private reportService = inject(ReportService);
  private budgetService = inject(BudgetService);
  private authService = inject(AuthService);
  private dialogService = inject(AppDialogService);
  private messageService = inject(MessageService);
  private ts = inject(TranslationService);

  isLoading = signal(true);
  summary = signal<DashboardSummary | null>(null);
  budgetDashboard = signal<BudgetDashboard | null>(null);
  cashFlow = signal<CashFlowSummary | null>(null);
  recentTransactions = signal<Transaction[]>([]);
  cards = signal<Card[]>([]);
  upcomingPayments = signal<UpcomingPayment[]>([]);
  currency = computed(() => this.authService.currentUser()?.currency || 'USD');
  userName = computed(() => this.authService.currentUser()?.name?.split(' ')[0] || 'User');

  // Chart configurations
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

  categoryChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${Number(ctx.raw || 0).toFixed(1)}%`,
        },
      },
    },
  };

  trendChartData = signal<ChartData<'line'>>({
    labels: [],
    datasets: [],
  });

  categoryChartData = signal<ChartData<'doughnut'>>({
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }],
  });

  categoryBreakdown = signal<{ name: string; color: string; percentage: number; amount: number }[]>([]);

  atRiskBudgets = computed(() =>
    (this.budgetDashboard()?.budgets ?? [])
      .filter(b => b.isExceeded || b.percentage >= b.budget.alertThreshold)
      .slice(0, 3)
  );

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);

    forkJoin({
      transactions: this.transactionService.getAll(),
      cards: this.cardService.getAll(),
      subscriptions: this.subscriptionService.getAll(),
      trendReport: this.reportService.generateTrendReport(ReportPeriod.MONTHLY, 6),
      categoryReport: this.reportService.generateCategoryReport(),
      budgets: this.budgetService.getDashboard().pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ transactions, cards, subscriptions, trendReport, categoryReport, budgets }) => {
        // Process summary
        this.processSummary(transactions);

        // Recent transactions
        this.recentTransactions.set(
          [...transactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
        );

        // Cards
        this.cards.set(cards.filter((c) => c.type === CardType.CREDIT).slice(0, 3));

        // Upcoming payments
        this.processUpcomingPayments(subscriptions);

        // Trend chart
        this.processTrendChart(trendReport.dataPoints);

        // Category chart
        this.processCategoryChart(categoryReport.expenseByCategory);

        // Budgets
        if (budgets) this.budgetDashboard.set(budgets);

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
        this.isLoading.set(false);
      },
    });
  }

  private processSummary(transactions: Transaction[]): void {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthTx = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthTx = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    });

    // Total summary (includes all transactions)
    const currentIncome = currentMonthTx
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const currentExpenses = currentMonthTx
      .filter((t) => t.type === TransactionType.EXPENSE || t.type === TransactionType.CARD_PURCHASE)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const lastIncome = lastMonthTx
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const lastExpenses = lastMonthTx
      .filter((t) => t.type === TransactionType.EXPENSE || t.type === TransactionType.CARD_PURCHASE)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const incomeChange = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0;
    const expenseChange = lastExpenses > 0 ? ((currentExpenses - lastExpenses) / lastExpenses) * 100 : 0;

    this.summary.set({
      income: currentIncome,
      expenses: currentExpenses,
      balance: currentIncome - currentExpenses,
      incomeChange: isNaN(incomeChange) ? 0 : incomeChange,
      expenseChange: isNaN(expenseChange) ? 0 : expenseChange,
      transactionCount: currentMonthTx.length,
    });

    // Cash Flow summary (excludes card purchases - includes INCOME, EXPENSE, and CARD_PAYMENT)
    const isCashTransaction = (t: Transaction): boolean => {
      // INCOME and EXPENSE without cardId (direct cash)
      if ((t.type === TransactionType.INCOME || t.type === TransactionType.EXPENSE) && !t.cardId) {
        return true;
      }
      // CARD_PAYMENT always affects cash (even with cardId)
      if (t.type === TransactionType.CARD_PAYMENT) {
        return true;
      }
      return false;
    };

    const currentCashTx = currentMonthTx.filter(isCashTransaction);
    const lastCashTx = lastMonthTx.filter(isCashTransaction);

    const currentCashIncome = currentCashTx
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const currentCashExpenses = currentCashTx
      .filter((t) => t.type === TransactionType.EXPENSE || t.type === TransactionType.CARD_PAYMENT)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const lastCashIncome = lastCashTx
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const lastCashExpenses = lastCashTx
      .filter((t) => t.type === TransactionType.EXPENSE || t.type === TransactionType.CARD_PAYMENT)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const cashIncomeChange = lastCashIncome > 0 ? ((currentCashIncome - lastCashIncome) / lastCashIncome) * 100 : 0;
    const cashExpenseChange = lastCashExpenses > 0 ? ((currentCashExpenses - lastCashExpenses) / lastCashExpenses) * 100 : 0;

    this.cashFlow.set({
      income: currentCashIncome,
      expenses: currentCashExpenses,
      balance: currentCashIncome - currentCashExpenses,
      incomeChange: isNaN(cashIncomeChange) ? 0 : cashIncomeChange,
      expenseChange: isNaN(cashExpenseChange) ? 0 : cashExpenseChange,
    });
  }

  private processUpcomingPayments(subscriptions: Subscription[]): void {
    const now = new Date();
    const payments: UpcomingPayment[] = subscriptions
      .filter((s) => s.isActive)
      .map((sub) => {
        let nextDate = setDate(now, sub.paymentDay || 1);
        if (isBefore(nextDate, now)) {
          nextDate = setDate(addMonths(now, 1), sub.paymentDay || 1);
        }
        return {
          name: sub.name,
          amount: Number(sub.amount || 0),
          dueDate: format(nextDate, 'MMM dd'),
          daysUntil: differenceInDays(nextDate, now),
          category: sub.category?.name,
          categoryColor: sub.category?.color || '#6b7280',
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 4);

    this.upcomingPayments.set(payments);
  }

  private processTrendChart(dataPoints: { label: string; income: number; expenses: number }[]): void {
    this.trendChartData.set({
      labels: dataPoints.map((p) => p.label),
      datasets: [
        {
          label: this.ts.t('dashboard.income'),
          data: dataPoints.map((p) => Number(p.income || 0)),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: this.ts.t('dashboard.expenses'),
          data: dataPoints.map((p) => Number(p.expenses || 0)),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    });
  }

  private processCategoryChart(categories: { categoryName: string; categoryColor: string; percentage: number; amount: number }[]): void {
    const top5 = categories.slice(0, 5);

    this.categoryChartData.set({
      labels: top5.map((c) => c.categoryName),
      datasets: [
        {
          data: top5.map((c) => Number(c.percentage || 0)),
          backgroundColor: top5.map((c) => c.categoryColor),
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    });

    this.categoryBreakdown.set(
      top5.map((c) => ({
        name: c.categoryName,
        color: c.categoryColor,
        percentage: Number(c.percentage || 0),
        amount: Number(c.amount || 0),
      }))
    );
  }

  openAddTransaction(): void {
    const ref = this.dialogService.open(TransactionFormComponent, {
      header: this.ts.t('transactions.dialogNew'),
      width: '500px',
    });

    ref.onClose.subscribe((result: Transaction | undefined) => {
      if (result) {
        this.loadDashboardData();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Transaction created successfully',
        });
      }
    });
  }

  getCardUtilization(card: Card): number {
    // Simplified - in real app would calculate from transactions
    const limit = Number(card.creditLimit || 1);
    const used = limit * 0.3; // Placeholder
    return (used / limit) * 100;
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return this.ts.t('dashboard.greeting.morning');
    if (hour < 18) return this.ts.t('dashboard.greeting.afternoon');
    return this.ts.t('dashboard.greeting.evening');
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

  formatCompact(value: number): string {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  }

  getTransactionIcon(type: TransactionType): string {
    switch (type) {
      case TransactionType.INCOME:
        return 'pi-arrow-down-left';
      case TransactionType.EXPENSE:
        return 'pi-arrow-up-right';
      case TransactionType.CARD_PURCHASE:
        return 'pi-credit-card';
      case TransactionType.CARD_PAYMENT:
        return 'pi-wallet';
      default:
        return 'pi-money-bill';
    }
  }
}
