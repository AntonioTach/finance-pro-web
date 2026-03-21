export type DebtDirection = 'owed_by_me' | 'owed_to_me';
export type DebtStatus = 'active' | 'completed' | 'cancelled';

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  paymentDate: string;
  installmentNumber: number | null;
  notes: string | null;
  transactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Debt {
  id: string;
  userId: string;
  direction: DebtDirection;
  counterparty: string;
  description: string;
  totalAmount: number;
  installments: number | null;
  interestRate: number | null;
  startDate: string;
  dueDate: string | null;
  notes: string | null;
  status: DebtStatus;
  payments: DebtPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDebtDto {
  direction: DebtDirection;
  counterparty: string;
  description: string;
  totalAmount: number;
  installments?: number;
  interestRate?: number;
  startDate: string;
  dueDate?: string;
  notes?: string;
  status?: DebtStatus;
}

export interface UpdateDebtDto extends Partial<CreateDebtDto> {}

export interface CreateDebtPaymentDto {
  amount: number;
  paymentDate: string;
  categoryId: string;
  installmentNumber?: number;
  notes?: string;
}
