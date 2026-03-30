export type Category = 'Food' | 'Travel' | 'Bills' | 'Shopping' | 'Other'

export interface Expense {
  id: string
  title: string
  amount: number
  category: Category
  date: string
  timestamp: number
}

export const CATEGORIES: Category[] = ['Food', 'Travel', 'Bills', 'Shopping', 'Other']

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: 'bg-chart-1 text-primary-foreground',
  Travel: 'bg-chart-2 text-primary-foreground',
  Bills: 'bg-chart-3 text-primary-foreground',
  Shopping: 'bg-chart-4 text-primary-foreground',
  Other: 'bg-chart-5 text-primary-foreground',
}
