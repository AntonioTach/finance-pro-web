import { BalanceAnchor } from './account.model';

export type ReconciliationTargetType = 'account' | 'card';

export interface ReconciliationPreview {
  date: string;
  accounts: {
    accountId: string;
    name: string;
    type: string;
    isDefault: boolean;
    computedAmount: number;
    lastReconciliation: BalanceAnchor | null;
  }[];
  cards: {
    cardId: string;
    name: string;
    last4: string | null;
    /** Current debt (excluding future MSI installments). */
    computedAmount: number;
    msiPending: number;
    creditLimit: number | null;
    lastReconciliation: BalanceAnchor | null;
  }[];
}

export interface ReconciliationItem {
  id: string;
  targetType: ReconciliationTargetType;
  accountId: string | null;
  cardId: string | null;
  name: string;
  last4: string | null;
  computedAmount: number;
  realAmount: number;
  /** real − computed */
  difference: number;
}

export interface Reconciliation {
  id: string;
  date: string;
  notes: string | null;
  createdAt: string;
  items: ReconciliationItem[];
  /** Positive = more money than recorded. */
  accountsDifference: number;
  /** Positive = more card debt than recorded. */
  cardsDifference: number;
}

export interface CreateReconciliationDto {
  date: string;
  notes?: string;
  items: { accountId?: string; cardId?: string; realAmount: number }[];
}
