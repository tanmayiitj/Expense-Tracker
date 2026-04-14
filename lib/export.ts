import * as XLSX from 'xlsx'
import type { Expense } from '@/lib/expense-types'
import { getExpenseCategories } from '@/lib/utils'

function sanitizeFilename(str: string): string {
  return str.replace(/[^a-zA-Z0-9\-_ ]/g, '').slice(0, 50)
}

export function exportExpensesToExcel(
  expenses: Expense[],
  monthFilter: string | 'All',
  categoryFilter: string[]
) {
  const now = new Date()
  const year = now.getFullYear()

  const parts: string[] = ['expenses']
  if (monthFilter !== 'All') {
    parts.push(sanitizeFilename(monthFilter.replace(' ', '-')))
  }
  if (categoryFilter.length > 0) {
    parts.push(sanitizeFilename(categoryFilter.join('-')))
  }
  parts.push(String(year))

  const filename = `${parts.join('-')}.xlsx`
  const sheetName = (monthFilter !== 'All'
    ? sanitizeFilename(monthFilter)
    : `All Expenses ${year}`
  ).slice(0, 31) // Excel sheet names max 31 chars

  const data = expenses.map((expense) => ({
    Title: expense.title,
    Amount: expense.amount,
    Category: getExpenseCategories(expense).join(', '),
    Date: new Date(expense.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)

  // Auto-size columns
  const colWidths = [
    { wch: Math.max(8, ...data.map((d) => d.Title.length)) },
    { wch: 12 },
    { wch: Math.max(10, ...data.map((d) => d.Category.length)) },
    { wch: 14 },
  ]
  worksheet['!cols'] = colWidths

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, filename)
}
