import { Category } from './category.model';

export enum BudgetPeriod {
  WEEKLY    = 'weekly',
  BIWEEKLY  = 'biweekly',
  MONTHLY   = 'monthly',
  YEARLY    = 'yearly',
  CUSTOM    = 'custom',
}

export enum BudgetAmountType {
  FIXED   = 'fixed',
  PERCENT = 'percent',
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  name?: string;
  amount: number;
  amountType: BudgetAmountType;
  amountPercent?: number;
  period: BudgetPeriod;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  alertThreshold: number;
  notes?: string;
  rolloverEnabled: boolean;
  rolloverAmount?: number;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

export interface BudgetProgress {
  budget: {
    id: string;
    name?: string;
    amount: number;
    baseAmount: number;
    rollover: number;
    period: BudgetPeriod;
    alertThreshold: number;
    periodStart: string;
    periodEnd: string;
    category?: Category;
    autoRenew: boolean;
    rolloverEnabled: boolean;
    notes?: string;
  };
  spent: number;
  remaining: number;
  percentage: number;
  isExceeded: boolean;
  burnRate: number;
  projected: number;
  daysLeft: number;
  totalDays: number;
  elapsedDays: number;
}

export interface BudgetDashboard {
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  globalPercentage: number;
  unreadAlerts: number;
  budgets: BudgetProgress[];
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  userId: string;
  type: 'threshold_50' | 'threshold_80' | 'threshold_100' | 'exceeded' | 'burn_rate' | 'renewal';
  triggeredAt: string;
  isRead: boolean;
  message: string;
  percentage: number;
  periodKey: string;
  budget?: Budget & { category?: Category };
}

export interface BudgetSuggestion {
  categoryId: string;
  category?: Category;
  monthlyAverage: number;
  totalLast3Months: number;
}

export interface CreateBudgetDto {
  categoryId: string;
  name?: string;
  amount: number;
  amountType?: BudgetAmountType;
  amountPercent?: number;
  period: BudgetPeriod;
  startDate: string;
  endDate?: string;
  alertThreshold?: number;
  rolloverEnabled?: boolean;
  autoRenew?: boolean;
  notes?: string;
}
