export enum CardType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum CardNetwork {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  AMEX = 'amex',
  OTHER = 'other',
}

export enum CardStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum PaymentDueType {
  FIXED_DAY_OF_MONTH = 'fixed_day',
  DAYS_AFTER_CUTOFF = 'days_after',
}

export interface Card {
  id: string;
  userId: string;
  name: string;
  type: CardType;
  network?: CardNetwork;
  last4?: string;
  currency: string;
  creditLimit?: number;
  billingCutoffDay?: number;
  paymentDueType?: PaymentDueType;
  paymentDueValue?: number;
  status: CardStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CardSummary {
  cardId: string;
  cardName: string;
  cardType: CardType;
  network: string | null;
  last4: string | null;
  currency: string;
  outstandingDebt: number | null;
  availableCredit: number | null;
  creditLimit: number | null;
  nextCutoffDate: string | null;
  nextDueDate: string | null;
}

export interface CreateCardDto {
  name: string;
  type: CardType;
  network?: CardNetwork;
  last4?: string;
  currency?: string;
  creditLimit?: number;
  billingCutoffDay?: number;
  paymentDueType?: PaymentDueType;
  paymentDueValue?: number;
}

export interface UpdateCardDto extends Partial<CreateCardDto> {
  status?: CardStatus;
}
