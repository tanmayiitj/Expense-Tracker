import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { MONTHS } from '@/lib/expense-types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCycleLabel(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

export function getExpenseCycleLabel(expense: { cycleLabel?: string; date: string }): string {
  if (expense.cycleLabel) return expense.cycleLabel
  return getCycleLabel(new Date(expense.date))
}

export function getExpenseCategories(expense: { category: string | string[] }): string[] {
  return Array.isArray(expense.category) ? expense.category : [expense.category]
}
