export interface Expense {
  id: string
  title: string
  amount: number
  category: string | string[]
  date: string
  timestamp: number
  cycleLabel?: string
}

export interface UserSettings {
  currentCycleStart: string
  currentCycleLabel: string
  salary: number
  isOnboarded: boolean
  encryptionEnabled?: boolean
  encryptionVerify?: string   // encrypted token to verify passphrase
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

/** Maps each Tailwind color palette entry to a hex value for use in charts */
export const CATEGORY_COLOR_HEX: Record<string, string> = {
  'bg-red-500 text-white': '#ef4444',
  'bg-blue-500 text-white': '#3b82f6',
  'bg-emerald-500 text-white': '#10b981',
  'bg-amber-500 text-white': '#f59e0b',
  'bg-purple-500 text-white': '#a855f7',
  'bg-pink-500 text-white': '#ec4899',
  'bg-cyan-500 text-white': '#06b6d4',
  'bg-orange-500 text-white': '#f97316',
  'bg-indigo-500 text-white': '#6366f1',
  'bg-teal-500 text-white': '#14b8a6',
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
