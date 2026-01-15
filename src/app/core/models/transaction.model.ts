import { Category } from './category.model';
import { Card } from './card.model';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  CARD_PURCHASE = 'card_purchase',
  CARD_PAYMENT = 'card_payment',
}

export const MSI_OPTIONS = [3, 6, 9, 12, 15, 18, 24] as const;
export type MsiOption = typeof MSI_OPTIONS[number];

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  date: string;
  notes?: string;
  cardId?: string;
  installmentMonths?: number;
  installmentCurrent?: number;
  parentTransactionId?: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  card?: Card;
  parentTransaction?: Transaction;
  installments?: Transaction[];
}

