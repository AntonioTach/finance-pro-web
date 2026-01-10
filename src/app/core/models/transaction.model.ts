import { Category } from './category.model';
import { Card } from './card.model';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  CARD_PURCHASE = 'card_purchase',
  CARD_PAYMENT = 'card_payment',
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
  cardId?: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  card?: Card;
}

