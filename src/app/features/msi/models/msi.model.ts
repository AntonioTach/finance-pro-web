export interface MsiDetail {
  transactionId: string;
  description: string;
  monthlyAmount: number;
  remainingMonths: number;
  totalMonths: number;
  /** What this group actually charges in this specific month — constant
   * across its active window, unlike the declining remaining balance. */
  amountDueThisMonth: number;
}

export interface MonthProjection {
  month: number;
  totalDebt: number;
  msiDebt: number;
  /** Flat "what hits your statement this month" figure (sum of
   * amountDueThisMonth across active groups), as opposed to totalDebt which
   * is the declining remaining balance. */
  monthlyPaymentDue: number;
  msiDetails: MsiDetail[];
  isPaidOff: boolean;
}

export interface CardYearlyProjection {
  cardId: string;
  cardName: string;
  network: string | null;
  last4: string | null;
  maxDebt: number;
  maxPaymentDue: number;
  projection: MonthProjection[];
}

export interface YearlyProjectionResponse {
  year: number;
  cards: CardYearlyProjection[];
  totalMaxDebt: number;
  totalMaxPaymentDue: number;
  /** Sum of every card's remaining debt per month — a portfolio-wide total,
   * since each card's own bars are scaled against its own max and aren't
   * comparable to one another. */
  totalByMonth: number[];
  /** Same idea as totalByMonth, but for monthlyPaymentDue instead of totalDebt. */
  paymentDueByMonth: number[];
}

export type MsiGroupStatus = 'active' | 'completed';

export interface MsiGroupSummary {
  parentTransactionId: string;
  description: string;
  categoryId: string;
  cardId: string;
  cardName: string;
  cardLast4: string | null;
  totalMonths: number;
  monthlyAmount: number;
  totalAmount: number;
  remainingAmount: number;
  remainingMonths: number;
  installmentsPaid: number;
  startDate: string;
  endDate: string;
  status: MsiGroupStatus;
}

export interface MsiGroupFilters {
  cardId?: string;
  status?: MsiGroupStatus;
}

export const MONTH_NAMES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
] as const;
