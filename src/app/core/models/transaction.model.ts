import { Category } from './category.model';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

