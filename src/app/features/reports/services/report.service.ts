import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { TransactionService } from '../../transactions/services/transaction.service';
import { CardService } from '../../cards/services/card.service';
import { SubscriptionService } from '../../subscriptions/services/subscription.service';
import { CategoryService } from '../../categories/services/category.service';
import { Transaction, TransactionType } from '../../../core/models/transaction.model';
import { Category, CategoryType } from '../../../core/models/category.model';
import { Card } from '../../../core/models/card.model';
import { Subscription } from '../../../core/models/subscription.model';
import {
  OverviewReport,
  CategoryReport,
  CategoryBreakdown,
  CardReport,
  CardUsageStats,
  SubscriptionReport,
  SubscriptionStats,
  TrendReport,
  TimeSeriesDataPoint,
  FinancialSummary,
  TransactionReportFilters,
  ReportPeriod,
  DateRangeFilter,
} from '../../../core/models/report.model';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  parseISO,
  differenceInDays,
  addMonths,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  isWithinInterval,
  setDate,
  isBefore,
  isAfter,
} from 'date-fns';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private apiService = inject(ApiService);
  private transactionService = inject(TransactionService);
  private cardService = inject(CardService);
  private subscriptionService = inject(SubscriptionService);
  private categoryService = inject(CategoryService);

  /** Get monthly report from API (legacy) */
  getMonthlyReport(filters?: DateRangeFilter): Observable<any> {
    return this.apiService.get<any>('/reports/monthly', filters);
  }

  /** Get category report from API (legacy) */
  getByCategory(filters?: DateRangeFilter): Observable<any> {
    return this.apiService.get<any>('/reports/by-category', filters);
  }

  /** Get trends from API (legacy) */
  getTrends(filters?: DateRangeFilter): Observable<any> {
    return this.apiService.get<any>('/reports/trends', filters);
  }

  /** Generate overview report with all data */
  generateOverviewReport(dateRange?: DateRangeFilter): Observable<OverviewReport> {
    const now = new Date();
    // Default to last 6 months instead of just current month
    const currentStart = dateRange?.startDate || format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd');
    const currentEnd = dateRange?.endDate || format(endOfMonth(now), 'yyyy-MM-dd');

    const previousStart = format(startOfMonth(subMonths(parseISO(currentStart), 1)), 'yyyy-MM-dd');
    const previousEnd = format(endOfMonth(subMonths(parseISO(currentEnd), 1)), 'yyyy-MM-dd');

    return forkJoin({
      transactions: this.transactionService.getAll(),
      categories: this.categoryService.getAll(),
    }).pipe(
      map(({ transactions, categories }) => {
        const currentTransactions = this.filterTransactionsByDate(transactions, currentStart, currentEnd);
        const previousTransactions = this.filterTransactionsByDate(transactions, previousStart, previousEnd);

        const currentSummary = this.calculateSummary(currentTransactions);
        const previousSummary = this.calculateSummary(previousTransactions);

        const incomeBreakdown = this.calculateCategoryBreakdown(currentTransactions, categories, CategoryType.INCOME);
        const expenseBreakdown = this.calculateCategoryBreakdown(currentTransactions, categories, CategoryType.EXPENSE);

        return {
          summary: currentSummary,
          previousPeriodSummary: previousSummary,
          incomeChange: this.calculatePercentageChange(currentSummary.totalIncome, previousSummary.totalIncome),
          expenseChange: this.calculatePercentageChange(currentSummary.totalExpenses, previousSummary.totalExpenses),
          balanceChange: this.calculatePercentageChange(currentSummary.balance, previousSummary.balance),
          topIncomeCategories: incomeBreakdown.slice(0, 5),
          topExpenseCategories: expenseBreakdown.slice(0, 5),
          recentTransactions: currentTransactions.slice(0, 10),
        };
      })
    );
  }

  /** Generate category report with breakdown */
  generateCategoryReport(dateRange?: DateRangeFilter): Observable<CategoryReport> {
    const now = new Date();
    // Default to last 6 months instead of just current month
    const startDate = dateRange?.startDate || format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd');
    const endDate = dateRange?.endDate || format(endOfMonth(now), 'yyyy-MM-dd');

    console.log('[CategoryReport] Date range:', { startDate, endDate });

    return forkJoin({
      transactions: this.transactionService.getAll(),
      categories: this.categoryService.getAll(),
    }).pipe(
      map(({ transactions, categories }) => {
        console.log('[CategoryReport] Raw transactions:', transactions.length, transactions.slice(0, 3));
        console.log('[CategoryReport] Raw categories:', categories.length, categories);

        const filteredTransactions = this.filterTransactionsByDate(transactions, startDate, endDate);
        console.log('[CategoryReport] Filtered transactions:', filteredTransactions.length);

        const incomeByCategory = this.calculateCategoryBreakdown(filteredTransactions, categories, CategoryType.INCOME);
        const expenseByCategory = this.calculateCategoryBreakdown(filteredTransactions, categories, CategoryType.EXPENSE);

        console.log('[CategoryReport] Income by category:', incomeByCategory);
        console.log('[CategoryReport] Expense by category:', expenseByCategory);

        const totalIncome = incomeByCategory.reduce((sum, cat) => sum + cat.amount, 0);
        const totalExpenses = expenseByCategory.reduce((sum, cat) => sum + cat.amount, 0);

        console.log('[CategoryReport] Totals:', { totalIncome, totalExpenses });

        return {
          period: { startDate, endDate },
          incomeByCategory,
          expenseByCategory,
          totalIncome,
          totalExpenses,
        };
      })
    );
  }

  /** Generate transaction report with filters */
  generateTransactionReport(filters?: TransactionReportFilters): Observable<Transaction[]> {
    return this.transactionService.getAll().pipe(
      map((transactions) => {
        let filtered = [...transactions];

        if (filters?.startDate) {
          filtered = filtered.filter((t) => t.date >= filters.startDate!);
        }
        if (filters?.endDate) {
          filtered = filtered.filter((t) => t.date <= filters.endDate!);
        }
        if (filters?.type) {
          filtered = filtered.filter((t) => t.type === filters.type);
        }
        if (filters?.categoryId) {
          filtered = filtered.filter((t) => t.categoryId === filters.categoryId);
        }
        if (filters?.cardId) {
          filtered = filtered.filter((t) => t.cardId === filters.cardId);
        }
        if (filters?.minAmount !== undefined) {
          filtered = filtered.filter((t) => t.amount >= filters.minAmount!);
        }
        if (filters?.maxAmount !== undefined) {
          filtered = filtered.filter((t) => t.amount <= filters.maxAmount!);
        }
        if (filters?.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          filtered = filtered.filter(
            (t) =>
              t.description.toLowerCase().includes(term) ||
              t.notes?.toLowerCase().includes(term) ||
              t.category?.name.toLowerCase().includes(term)
          );
        }

        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      })
    );
  }

  /** Generate card usage report */
  generateCardReport(): Observable<CardReport> {
    return forkJoin({
      cards: this.cardService.getAll(),
      transactions: this.transactionService.getAll(),
    }).pipe(
      map(({ cards, transactions }) => {
        const cardStats: CardUsageStats[] = cards.map((card) => {
          const cardTransactions = transactions.filter(
            (t) => t.cardId === card.id && (t.type === TransactionType.CARD_PURCHASE || t.type === TransactionType.EXPENSE)
          );
          const totalSpent = cardTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
          const transactionCount = cardTransactions.length;
          const avgTransaction = transactionCount > 0 ? totalSpent / transactionCount : 0;
          const creditLimit = Number(card.creditLimit || 0);
          const availableCredit = creditLimit > 0 ? creditLimit - totalSpent : 0;
          const utilizationPercentage = creditLimit > 0 ? (totalSpent / creditLimit) * 100 : 0;

          return {
            cardId: card.id,
            cardName: card.name,
            cardType: card.type,
            cardNetwork: card.network || 'other',
            last4: card.last4 || '****',
            totalSpent: totalSpent || 0,
            transactionCount: transactionCount || 0,
            averageTransaction: isNaN(avgTransaction) ? 0 : avgTransaction,
            creditLimit: creditLimit || 0,
            availableCredit: isNaN(availableCredit) ? 0 : availableCredit,
            utilizationPercentage: isNaN(utilizationPercentage) ? 0 : utilizationPercentage,
          };
        });

        const totalSpentAllCards = cardStats.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
        const totalCreditLimit = cardStats.reduce((sum, c) => sum + (c.creditLimit || 0), 0);
        const totalAvailableCredit = cardStats.reduce((sum, c) => sum + (c.availableCredit || 0), 0);
        const rawUtilization = totalCreditLimit > 0 ? (totalSpentAllCards / totalCreditLimit) * 100 : 0;
        const overallUtilization = isNaN(rawUtilization) ? 0 : rawUtilization;

        const cardsBySpending = [...cardStats].sort((a, b) => b.totalSpent - a.totalSpent);

        return {
          cards: cardStats,
          totalSpentAllCards,
          totalCreditLimit,
          totalAvailableCredit,
          overallUtilization,
          cardsBySpending,
        };
      })
    );
  }

  /** Generate subscription report */
  generateSubscriptionReport(): Observable<SubscriptionReport> {
    return forkJoin({
      subscriptions: this.subscriptionService.getAll(),
      categories: this.categoryService.getAll(),
      cards: this.cardService.getAll(),
    }).pipe(
      map(({ subscriptions, categories, cards }) => {
        const now = new Date();
        const activeSubscriptions = subscriptions.filter((s) => s.isActive);
        const inactiveSubscriptions = subscriptions.filter((s) => !s.isActive);

        const subscriptionStats: SubscriptionStats[] = activeSubscriptions.map((sub) => {
          const nextPaymentDate = this.calculateNextPaymentDate(sub.paymentDay || 1);
          const daysUntilPayment = differenceInDays(nextPaymentDate, now);
          const subAmount = Number(sub.amount || 0);

          return {
            subscription: sub,
            yearlyAmount: subAmount * 12,
            nextPaymentDate: format(nextPaymentDate, 'yyyy-MM-dd'),
            daysUntilPayment: daysUntilPayment < 0 ? daysUntilPayment + 30 : daysUntilPayment,
          };
        });

        const totalMonthlyAmount = activeSubscriptions.reduce((sum, s) => sum + Number(s.amount || 0), 0);
        const totalYearlyAmount = totalMonthlyAmount * 12;

        const subscriptionsByCategory = this.calculateSubscriptionsByCategory(activeSubscriptions, categories);

        const subscriptionsByCard = cards
          .map((card) => {
            const cardSubs = activeSubscriptions.filter((s) => s.cardId === card.id);
            return {
              cardId: card.id,
              cardName: card.name,
              subscriptionCount: cardSubs.length,
              monthlyAmount: cardSubs.reduce((sum, s) => sum + Number(s.amount || 0), 0),
            };
          })
          .filter((c) => c.subscriptionCount > 0);

        const upcomingPayments = [...subscriptionStats]
          .sort((a, b) => a.daysUntilPayment - b.daysUntilPayment)
          .slice(0, 10);

        return {
          activeSubscriptions: subscriptionStats,
          inactiveSubscriptions,
          totalMonthlyAmount,
          totalYearlyAmount,
          subscriptionsByCategory,
          subscriptionsByCard,
          upcomingPayments,
        };
      })
    );
  }

  /** Generate trend report for charts */
  generateTrendReport(period: ReportPeriod = ReportPeriod.MONTHLY, months: number = 6): Observable<TrendReport> {
    return this.transactionService.getAll().pipe(
      map((transactions) => {
        console.log('[TrendReport] Raw transactions:', transactions.length, transactions.slice(0, 3));

        const now = new Date();
        const startDate = subMonths(startOfMonth(now), months - 1);
        const endDate = endOfMonth(now);

        console.log('[TrendReport] Date range:', { startDate, endDate, period, months });

        let intervals: Date[];
        let dateFormat: string;

        switch (period) {
          case ReportPeriod.DAILY:
            intervals = eachDayOfInterval({ start: startDate, end: endDate });
            dateFormat = 'yyyy-MM-dd';
            break;
          case ReportPeriod.WEEKLY:
            intervals = eachWeekOfInterval({ start: startDate, end: endDate });
            dateFormat = 'yyyy-MM-dd';
            break;
          case ReportPeriod.MONTHLY:
          default:
            intervals = eachMonthOfInterval({ start: startDate, end: endDate });
            dateFormat = 'yyyy-MM';
            break;
        }

        const dataPoints: TimeSeriesDataPoint[] = intervals.map((date) => {
          const periodStart = period === ReportPeriod.MONTHLY ? startOfMonth(date) : period === ReportPeriod.WEEKLY ? startOfWeek(date) : date;
          const periodEnd = period === ReportPeriod.MONTHLY ? endOfMonth(date) : period === ReportPeriod.WEEKLY ? endOfWeek(date) : date;

          const periodTransactions = transactions.filter((t) => {
            const tDate = parseISO(t.date);
            return isWithinInterval(tDate, { start: periodStart, end: periodEnd });
          });

          const income = periodTransactions
            .filter((t) => t.type === TransactionType.INCOME)
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

          const expenses = periodTransactions
            .filter((t) => t.type === TransactionType.EXPENSE || t.type === TransactionType.CARD_PURCHASE)
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

          return {
            date: format(date, dateFormat),
            label: format(date, period === ReportPeriod.MONTHLY ? 'MMM yyyy' : 'dd MMM'),
            income,
            expenses,
            balance: income - expenses,
          };
        });

        console.log('[TrendReport] Data points:', dataPoints);

        const dataPointCount = dataPoints.length || 1;
        const averageIncome = dataPoints.reduce((sum, d) => sum + Number(d.income || 0), 0) / dataPointCount;
        const averageExpenses = dataPoints.reduce((sum, d) => sum + Number(d.expenses || 0), 0) / dataPointCount;
        const projectedBalance = averageIncome - averageExpenses;

        console.log('[TrendReport] Averages:', { averageIncome, averageExpenses, projectedBalance });

        return {
          period,
          dataPoints,
          averageIncome: isNaN(averageIncome) ? 0 : averageIncome,
          averageExpenses: isNaN(averageExpenses) ? 0 : averageExpenses,
          projectedBalance: isNaN(projectedBalance) ? 0 : projectedBalance,
        };
      })
    );
  }

  /** Helper: Filter transactions by date range */
  private filterTransactionsByDate(transactions: Transaction[], startDate: string, endDate: string): Transaction[] {
    return transactions.filter((t) => t.date >= startDate && t.date <= endDate);
  }

  /** Helper: Calculate financial summary */
  private calculateSummary(transactions: Transaction[]): FinancialSummary {
    const incomeTransactions = transactions.filter((t) => t.type === TransactionType.INCOME);
    const expenseTransactions = transactions.filter(
      (t) => t.type === TransactionType.EXPENSE || t.type === TransactionType.CARD_PURCHASE
    );

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const balance = totalIncome - totalExpenses;

    return {
      totalIncome: isNaN(totalIncome) ? 0 : totalIncome,
      totalExpenses: isNaN(totalExpenses) ? 0 : totalExpenses,
      balance: isNaN(balance) ? 0 : balance,
      transactionCount: transactions.length || 0,
      incomeCount: incomeTransactions.length || 0,
      expenseCount: expenseTransactions.length || 0,
    };
  }

  /** Helper: Calculate category breakdown */
  private calculateCategoryBreakdown(
    transactions: Transaction[],
    categories: Category[],
    type: CategoryType
  ): CategoryBreakdown[] {
    const relevantCategories = categories.filter((c) => c.type === type);
    const transactionType = type === CategoryType.INCOME ? TransactionType.INCOME : TransactionType.EXPENSE;

    const relevantTransactions = transactions.filter(
      (t) => t.type === transactionType || (type === CategoryType.EXPENSE && t.type === TransactionType.CARD_PURCHASE)
    );

    const totalAmount = relevantTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const breakdown: CategoryBreakdown[] = relevantCategories
      .map((category) => {
        const categoryTransactions = relevantTransactions.filter((t) => t.categoryId === category.id);
        const amount = categoryTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;

        return {
          categoryId: category.id,
          categoryName: category.name,
          categoryColor: category.color || '#6b7280',
          categoryIcon: category.icon || 'tag',
          categoryType: category.type,
          amount: isNaN(amount) ? 0 : amount,
          percentage: isNaN(percentage) ? 0 : percentage,
          transactionCount: categoryTransactions.length || 0,
        };
      })
      .filter((b) => b.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    return breakdown;
  }

  /** Helper: Calculate percentage change */
  private calculatePercentageChange(current: number, previous: number): number {
    const safeCurrent = current || 0;
    const safePrevious = previous || 0;
    if (safePrevious === 0) return safeCurrent > 0 ? 100 : 0;
    const result = ((safeCurrent - safePrevious) / safePrevious) * 100;
    return isNaN(result) ? 0 : result;
  }

  /** Helper: Calculate next payment date for subscription */
  private calculateNextPaymentDate(paymentDay: number): Date {
    const now = new Date();
    let nextDate = setDate(now, paymentDay);

    if (isBefore(nextDate, now) || nextDate.getDate() === now.getDate()) {
      nextDate = setDate(addMonths(now, 1), paymentDay);
    }

    return nextDate;
  }

  /** Helper: Calculate subscriptions grouped by category */
  private calculateSubscriptionsByCategory(
    subscriptions: Subscription[],
    categories: Category[]
  ): CategoryBreakdown[] {
    const totalAmount = subscriptions.reduce((sum, s) => sum + Number(s.amount || 0), 0);

    return categories
      .map((category) => {
        const categorySubs = subscriptions.filter((s) => s.categoryId === category.id);
        const amount = categorySubs.reduce((sum, s) => sum + Number(s.amount || 0), 0);
        const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;

        return {
          categoryId: category.id,
          categoryName: category.name,
          categoryColor: category.color || '#6b7280',
          categoryIcon: category.icon || 'tag',
          categoryType: category.type,
          amount: isNaN(amount) ? 0 : amount,
          percentage: isNaN(percentage) ? 0 : percentage,
          transactionCount: categorySubs.length || 0,
        };
      })
      .filter((b) => b.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }
}
