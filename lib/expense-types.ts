export interface Expense {
  id: string
  title: string
  amount: number
  category: string
  date: string
  timestamp: number
  cycleLabel?: string
}

export interface UserSettings {
  currentCycleStart: string   // ISO date string of when current cycle began
  currentCycleLabel: string   // e.g. "April 2026"
  salary: number              // monthly salary/budget
  isOnboarded: boolean        // whether onboarding is complete
}

export interface CategoryItem {
  name: string
  color: string
}

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { name: 'Food', color: 'bg-red-500 text-white' },
  { name: 'Travel', color: 'bg-blue-500 text-white' },
  { name: 'Bills', color: 'bg-emerald-500 text-white' },
  { name: 'Shopping', color: 'bg-amber-500 text-white' },
  { name: 'Other', color: 'bg-purple-500 text-white' },
]

export const CATEGORY_COLOR_PALETTE = [
  'bg-red-500 text-white',
  'bg-blue-500 text-white',
  'bg-emerald-500 text-white',
  'bg-amber-500 text-white',
  'bg-purple-500 text-white',
  'bg-pink-500 text-white',
  'bg-cyan-500 text-white',
  'bg-orange-500 text-white',
  'bg-indigo-500 text-white',
  'bg-teal-500 text-white',
]

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
