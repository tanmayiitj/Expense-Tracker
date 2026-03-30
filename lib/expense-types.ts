export type Category = 'Food' | 'Travel' | 'Bills' | 'Shopping' | 'Other'

export type SplitType = 'paid' | 'owe'

export interface SplitPerson {
  name: string
  amount: number
}

export interface SplitDetails {
  type: SplitType
  splitCount?: number
  people: SplitPerson[]
}

export interface Expense {
  id: string
  title: string
  amount: number
  category: Category
  date: string
  timestamp: number
  splitDetails?: SplitDetails
}

export interface Split {
  id: string
  personName: string
  amount: number
  type: 'they_owe_me' | 'i_owe_them'
  description: string
  date: string
  timestamp: number
  settled: boolean
  expenseId?: string
}

export const CATEGORIES: Category[] = ['Food', 'Travel', 'Bills', 'Shopping', 'Other']

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: 'bg-chart-1 text-primary-foreground',
  Travel: 'bg-chart-2 text-primary-foreground',
  Bills: 'bg-chart-3 text-primary-foreground',
  Shopping: 'bg-chart-4 text-primary-foreground',
  Other: 'bg-chart-5 text-primary-foreground',
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
