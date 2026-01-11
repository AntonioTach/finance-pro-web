import { Category, CategoryType } from './category.model';
import { Transaction, TransactionType } from './transaction.model';
import { Card, CardType } from './card.model';
import { Subscription } from './subscription.model';

/** Date range filter for reports */
export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

/** Period type for trend analysis */
export enum ReportPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

/** Summary of income and expenses */
export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
}

/** Category breakdown with amounts */
export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  categoryType: CategoryType;
  amount: number;
  percentage: number;
  transactionCount: number;
}

/** Time series data point for charts */
export interface TimeSeriesDataPoint {
  date: string;
  label: string;
  income: number;
  expenses: number;
  balance: number;
}

/** Overview report with general financial status */
export interface OverviewReport {
  summary: FinancialSummary;
  previousPeriodSummary: FinancialSummary;
  incomeChange: number;
  expenseChange: number;
  balanceChange: number;
  topIncomeCategories: CategoryBreakdown[];
  topExpenseCategories: CategoryBreakdown[];
  recentTransactions: Transaction[];
}

/** Category report with detailed breakdown */
export interface CategoryReport {
  period: DateRangeFilter;
  incomeByCategory: CategoryBreakdown[];
  expenseByCategory: CategoryBreakdown[];
  totalIncome: number;
  totalExpenses: number;
}

/** Transaction report with filtering */
export interface TransactionReport {
  transactions: Transaction[];
  summary: FinancialSummary;
  filters: TransactionReportFilters;
  pagination: ReportPagination;
}

/** Filters for transaction report */
export interface TransactionReportFilters {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  categoryId?: string;
  cardId?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

/** Pagination for reports */
export interface ReportPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Card usage statistics */
export interface CardUsageStats {
  cardId: string;
  cardName: string;
  cardType: CardType;
  cardNetwork: string;
  last4: string;
  totalSpent: number;
  transactionCount: number;
  averageTransaction: number;
  creditLimit?: number;
  availableCredit?: number;
  utilizationPercentage?: number;
}

/** Card report with all cards summary */
export interface CardReport {
  cards: CardUsageStats[];
  totalSpentAllCards: number;
  totalCreditLimit: number;
  totalAvailableCredit: number;
  overallUtilization: number;
  cardsBySpending: CardUsageStats[];
}

/** Subscription statistics */
export interface SubscriptionStats {
  subscription: Subscription;
  yearlyAmount: number;
  nextPaymentDate: string;
  daysUntilPayment: number;
}

/** Subscription report */
export interface SubscriptionReport {
  activeSubscriptions: SubscriptionStats[];
  inactiveSubscriptions: Subscription[];
  totalMonthlyAmount: number;
  totalYearlyAmount: number;
  subscriptionsByCategory: CategoryBreakdown[];
  subscriptionsByCard: {
    cardId: string;
    cardName: string;
    subscriptionCount: number;
    monthlyAmount: number;
  }[];
  upcomingPayments: SubscriptionStats[];
}

/** Trend data for charts */
export interface TrendReport {
  period: ReportPeriod;
  dataPoints: TimeSeriesDataPoint[];
  averageIncome: number;
  averageExpenses: number;
  projectedBalance: number;
}

/** Complete monthly report */
export interface MonthlyReport {
  month: number;
  year: number;
  summary: FinancialSummary;
  categoryBreakdown: CategoryBreakdown[];
  dailyTrends: TimeSeriesDataPoint[];
  comparisonWithPreviousMonth: {
    incomeChange: number;
    expenseChange: number;
    balanceChange: number;
  };
}

