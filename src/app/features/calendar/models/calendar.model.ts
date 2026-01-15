export type CalendarEventType = 'cutoff' | 'due_date' | 'transaction' | 'msi_payment' | 'subscription';

export interface CalendarEvent {
  id: string;
  date: string;
  type: CalendarEventType;
  title: string;
  amount?: number;
  cardId?: string;
  cardName?: string;
  color?: string;
  transactionId?: string;
  subscriptionId?: string;
  installmentInfo?: {
    current: number;
    total: number;
    parentTransactionId: string;
  };
}

export interface CalendarDay {
  day: number;
  date: string;
  events: CalendarEvent[];
  isToday?: boolean;
  isCurrentMonth?: boolean;
}

export interface CardSummary {
  cardId: string;
  cardName: string;
  network: string | null;
  last4: string | null;
  msiAmount: number;
  purchasesAmount: number;
  subscriptionsAmount: number;
  totalAmount: number;
  dueDate: string | null;
  cutoffDate: string | null;
}

export interface MonthlyCalendarResponse {
  year: number;
  month: number;
  days: {
    day: number;
    date: string;
    events: CalendarEvent[];
  }[];
  summary: {
    totalToPay: number;
    byCard: CardSummary[];
  };
}

export interface MsiDetail {
  transactionId: string;
  description: string;
  monthlyAmount: number;
  remainingMonths: number;
  totalMonths: number;
}

export interface MonthProjection {
  month: number;
  totalDebt: number;
  msiDebt: number;
  msiDetails: MsiDetail[];
  isPaidOff: boolean;
}

export interface CardYearlyProjection {
  cardId: string;
  cardName: string;
  network: string | null;
  last4: string | null;
  maxDebt: number;
  projection: MonthProjection[];
}

export interface YearlyProjectionResponse {
  year: number;
  cards: CardYearlyProjection[];
  totalMaxDebt: number;
}

export type CalendarView = 'monthly' | 'yearly';

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

export const MONTH_NAMES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
] as const;

export const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;
