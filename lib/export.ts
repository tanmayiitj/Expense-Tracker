import * as XLSX from 'xlsx'
import type { Expense } from '@/lib/expense-types'
import { MONTHS } from '@/lib/expense-types'

export function exportExpensesToExcel(
  expenses: Expense[],
  monthFilter: number | 'All',
  categoryFilter: string[]
) {
  const now = new Date()
  const year = now.getFullYear()

  const parts: string[] = ['expenses']
  if (monthFilter !== 'All') {
    parts.push(MONTHS[monthFilter])
  }
  if (categoryFilter.length > 0) {
    parts.push(categoryFilter.join('-'))
  }
  parts.push(String(year))

  const filename = `${parts.join('-')}.xlsx`
  const sheetName = monthFilter !== 'All'
    ? `${MONTHS[monthFilter]} ${year}`
    : `All Expenses ${year}`

  const data = expenses.map((expense) => ({
    Title: expense.title,
    Amount: expense.amount,
    Category: expense.category,
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
