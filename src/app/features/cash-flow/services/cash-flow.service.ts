import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { TransactionService } from '../../transactions/services/transaction.service';
import { Transaction, TransactionType } from '../../../core/models/transaction.model';
import { DateRangeFilter, TimeSeriesDataPoint, ReportPeriod } from '../../../core/models/report.model';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  parseISO,
  isWithinInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
} from 'date-fns';

export interface CashFlowSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
  cardPaymentCount: number;
  cardPaymentTotal: number;
}

export interface CashFlowFilters extends DateRangeFilter {
  categoryId?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CashFlowService {
  private transactionService = inject(TransactionService);

  /**
   * Get cash flow summary for a date range
   */
  getCashFlowSummary(filters?: DateRangeFilter): Observable<CashFlowSummary> {
    return this.transactionService.getAll().pipe(
      map((transactions) => {
        let filtered = this.filterCashTransactions(transactions);

        if (filters?.startDate) {
          filtered = filtered.filter((t) => t.date >= filters.startDate);
        }
        if (filters?.endDate) {
          filtered = filtered.filter((t) => t.date <= filters.endDate);
        }

        const incomeTransactions = filtered.filter((t) => t.type === TransactionType.INCOME);
        const expenseTransactions = filtered.filter(
          (t) => t.type === TransactionType.EXPENSE || t.type === TransactionType.CARD_PAYMENT
        );
        const cardPaymentTransactions = filtered.filter((t) => t.type === TransactionType.CARD_PAYMENT);

        const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const cardPaymentTotal = cardPaymentTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);

        return {
          totalIncome,
          totalExpenses,
          netCashFlow: totalIncome - totalExpenses,
          transactionCount: filtered.length,
          incomeCount: incomeTransactions.length,
          expenseCount: expenseTransactions.length - cardPaymentTransactions.length,
          cardPaymentCount: cardPaymentTransactions.length,
          cardPaymentTotal,
        };
      })
    );
  }

  /**
   * Get all cash transactions with optional filters
   */
  getCashTransactions(filters?: CashFlowFilters): Observable<Transaction[]> {
    return this.transactionService.getAll().pipe(
      map((transactions) => {
        let filtered = this.filterCashTransactions(transactions);

        if (filters?.startDate) {
          filtered = filtered.filter((t) => t.date >= filters.startDate);
        }
        if (filters?.endDate) {
          filtered = filtered.filter((t) => t.date <= filters.endDate);
        }
        if (filters?.categoryId) {
          filtered = filtered.filter((t) => t.categoryId === filters.categoryId);
        }
        if (filters?.minAmount !== undefined) {
          filtered = filtered.filter((t) => Number(t.amount || 0) >= filters.minAmount!);
        }
        if (filters?.maxAmount !== undefined) {
          filtered = filtered.filter((t) => Number(t.amount || 0) <= filters.maxAmount!);
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

  /**
   * Get cash flow trend over time
   */
  getCashFlowTrend(period: ReportPeriod = ReportPeriod.MONTHLY, months: number = 6): Observable<TimeSeriesDataPoint[]> {
    return this.transactionService.getAll().pipe(
      map((transactions) => {
        const cashTransactions = this.filterCashTransactions(transactions);
        const now = new Date();
        const startDate = subMonths(startOfMonth(now), months - 1);
        const endDate = endOfMonth(now);

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

        return intervals.map((date) => {
          const periodStart =
            period === ReportPeriod.MONTHLY ? startOfMonth(date) : period === ReportPeriod.WEEKLY ? startOfWeek(date) : date;
          const periodEnd =
            period === ReportPeriod.MONTHLY ? endOfMonth(date) : period === ReportPeriod.WEEKLY ? endOfWeek(date) : date;

          const periodTransactions = cashTransactions.filter((t) => {
            const tDate = parseISO(t.date);
            return isWithinInterval(tDate, { start: periodStart, end: periodEnd });
          });

          const income = periodTransactions
            .filter((t) => t.type === TransactionType.INCOME)
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

          const expenses = periodTransactions
            .filter((t) => t.type === TransactionType.EXPENSE || t.type === TransactionType.CARD_PAYMENT)
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

          return {
            date: format(date, dateFormat),
            label: format(date, period === ReportPeriod.MONTHLY ? 'MMM yyyy' : 'dd MMM'),
            income,
            expenses,
            balance: income - expenses,
          };
        });
      })
    );
  }

  /**
   * Get available cash (cumulative from all time)
   */
  getAvailableCash(): Observable<number> {
    return this.transactionService.getAll().pipe(
      map((transactions) => {
        const cashTransactions = this.filterCashTransactions(transactions);
        
        const totalIncome = cashTransactions
          .filter((t) => t.type === TransactionType.INCOME)
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const totalExpenses = cashTransactions
          .filter((t) => t.type === TransactionType.EXPENSE || t.type === TransactionType.CARD_PAYMENT)
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        return totalIncome - totalExpenses;
      })
    );
  }

  /**
   * Filter transactions to only include cash-affecting transactions
   * - INCOME without cardId (direct cash income)
   * - EXPENSE without cardId (direct cash expense)
   * - CARD_PAYMENT (always affects cash, even with cardId)
   * - Excludes CARD_PURCHASE (doesn't affect cash immediately)
   */
  private filterCashTransactions(transactions: Transaction[]): Transaction[] {
    return transactions.filter((t) => {
      // INCOME and EXPENSE without cardId (direct cash)
      if ((t.type === TransactionType.INCOME || t.type === TransactionType.EXPENSE) && !t.cardId) {
        return true;
      }
      // CARD_PAYMENT always affects cash (even with cardId)
      if (t.type === TransactionType.CARD_PAYMENT) {
        return true;
      }
      return false;
    });
  }

  /**
   * Get default date range (last 3 months)
   */
  getDefaultDateRange(): DateRangeFilter {
    const now = new Date();
    return {
      startDate: format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
    };
  }
}
