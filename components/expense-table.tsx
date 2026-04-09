'use client'

import { Trash2, Pencil, Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import type { Expense, CategoryItem } from '@/lib/expense-types'

interface ExpenseTableProps {
  expenses: Expense[]
  onDeleteExpense: (id: string) => void
  onEditExpense: (expense: Expense) => void
  categories: CategoryItem[]
}

export function ExpenseTable({ expenses, onDeleteExpense, onEditExpense, categories }: ExpenseTableProps) {
  const getCategoryColor = (categoryName: string) => {
    const cat = categories.find((c) => c.name === categoryName)
    return cat?.color ?? 'bg-chart-5 text-primary-foreground'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
  }

  if (expenses.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12">
          <Empty>
            <EmptyMedia variant="icon">
              <Receipt className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No expenses yet</EmptyTitle>
            <EmptyDescription>
              Start tracking your spending by adding your first expense above.
            </EmptyDescription>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Recent Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                <TableHead className="font-medium">Title</TableHead>
                <TableHead className="font-medium">Category</TableHead>
                <TableHead className="font-medium text-right">Amount</TableHead>
                <TableHead className="font-medium">Date & Time</TableHead>
                <TableHead className="font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => {
                const { date, time } = formatDateTime(expense.date)
                return (
                  <TableRow 
                    key={expense.id} 
                    className="hover:bg-secondary/20"
                  >
                    <TableCell className="font-medium">{expense.title}</TableCell>
                    <TableCell>
                      <Badge className={`${getCategoryColor(expense.category)} border-0`}>
                        {expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{date}</span>
                        <span className="text-xs text-muted-foreground">{time}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditExpense(expense)}
                          className="size-8 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="size-4" />
                          <span className="sr-only">Edit expense</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteExpense(expense.id)}
                          className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Delete expense</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
