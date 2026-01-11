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
