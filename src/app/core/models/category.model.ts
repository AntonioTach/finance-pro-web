export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

