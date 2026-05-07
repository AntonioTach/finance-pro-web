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
  group?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export const GROUP_ICONS: Record<string, string> = {
  'Alimentación':   '🍽️',
  'Transporte':     '🚗',
  'Hogar':          '🏠',
  'Salud':          '❤️',
  'Educación':      '📚',
  'Entretenimiento':'🎭',
  'Personal':       '👤',
  'Finanzas':       '💰',
  'Tecnología':     '💻',
  'Trabajo':        '💼',
  'Inversiones':    '📈',
  'Rentas':         '🏘️',
  'Ventas':         '🛒',
  'Otros':          '📦',
};

