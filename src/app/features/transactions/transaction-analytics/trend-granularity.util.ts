import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { TrendGranularity } from '../models/transaction-list-filters.model';

/** Mirrors ReportsService.resolveGranularity on the backend, so the frontend
 * always knows which granularity it's about to request (and can therefore
 * format labels correctly) instead of guessing from the returned points. */
export function resolveTrendGranularity(startDate?: string, endDate?: string): TrendGranularity {
  if (!startDate && !endDate) return 'month';
  const start = startDate ? parseISO(startDate) : parseISO(endDate!);
  const end = endDate ? parseISO(endDate) : parseISO(startDate!);
  const spanDays = Math.abs(differenceInCalendarDays(end, start));
  if (spanDays <= 31) return 'day';
  if (spanDays <= 180) return 'week';
  return 'month';
}

export function formatTrendLabel(dateIso: string, granularity: TrendGranularity): string {
  const date = parseISO(dateIso);
  switch (granularity) {
    case 'day':
      return format(date, 'MMM d');
    case 'week':
      return format(date, 'MMM d');
    case 'month':
    default:
      return format(date, 'MMM yyyy');
  }
}
