export type AccountType = 'cash' | 'bank' | 'digital_wallet' | 'other';

export interface BalanceAnchor {
  reconciliationId: string;
  date: string;
  realAmount: number;
  difference: number;
}

/** Account as returned by the API, always with its computed current balance. */
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
  isDefault: boolean;
  status: 'active' | 'inactive';
  balance: number;
  lastReconciliation: BalanceAnchor | null;
}

export interface AccountBalances {
  asOf: string;
  accounts: Account[];
  total: number;
}

export interface CreateAccountDto {
  name: string;
  type: AccountType;
  currency?: string;
  initialBalance?: number;
  isDefault?: boolean;
}

export type UpdateAccountDto = Partial<CreateAccountDto>;

export interface AccountTransfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string;
  notes: string | null;
  fromAccount?: { id: string; name: string };
  toAccount?: { id: string; name: string };
  createdAt: string;
}

export interface CreateTransferDto {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string;
  notes?: string;
}

export const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
  cash: 'pi-money-bill',
  bank: 'pi-building-columns',
  digital_wallet: 'pi-mobile',
  other: 'pi-wallet',
};
