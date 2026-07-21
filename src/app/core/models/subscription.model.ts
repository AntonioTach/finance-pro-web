import { Category } from './category.model';
import { Card } from './card.model';

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  amount: number;
  isActive: boolean;
  paymentDay: number;
  categoryId: string;
  cardId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  card?: Card;
  payments?: SubscriptionPayment[];
  priceHistory?: SubscriptionPriceHistory[];
}

export interface SubscriptionPayment {
  id: string;
  subscriptionId: string;
  amount: number;
  paymentDate: string;
  periodYear: number;
  periodMonth: number;
  isAutomatic: boolean;
  notes: string | null;
  transactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPriceHistory {
  id: string;
  subscriptionId: string;
  previousAmount: number;
  newAmount: number;
  changedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionPaymentDto {
  paymentDate: string;
  amount?: number;
  categoryId?: string;
  createTransaction?: boolean;
  notes?: string;
}

export interface CreateSubscriptionDto {
  name: string;
  amount: number;
  isActive?: boolean;
  paymentDay: number;
  categoryId: string;
  cardId?: string;
  notes?: string;
}

export interface UpdateSubscriptionDto extends Partial<CreateSubscriptionDto> {}
