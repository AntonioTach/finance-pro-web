import { TransactionType } from '../../../core/models/transaction.model';

export type TransactionSortField = 'date' | 'amount' | 'description' | 'createdAt';
export type SortOrder = 'ASC' | 'DESC';
export type TrendGranularity = 'day' | 'week' | 'month';

/** Filters shared by the transactions table and the scoped analytics (KPIs + charts) above it. */
export interface TransactionListFilters {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  categoryId?: string;
  cardId?: string;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
  page: number;
  limit: number;
  sortBy: TransactionSortField;
  sortOrder: SortOrder;
}

export const DEFAULT_TRANSACTION_FILTERS: TransactionListFilters = {
  page: 1,
  limit: 25,
  sortBy: 'date',
  sortOrder: 'DESC',
};

/** The subset of filters that scope the analytics (KPI/charts) calls — excludes table-only paging/sorting. */
export type AnalyticsFilters = Omit<TransactionListFilters, 'page' | 'limit' | 'sortBy' | 'sortOrder'>;

export function toAnalyticsFilters(filters: TransactionListFilters): AnalyticsFilters {
  const { page, limit, sortBy, sortOrder, ...rest } = filters;
  return rest;
}
