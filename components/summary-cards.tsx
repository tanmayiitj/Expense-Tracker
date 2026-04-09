'use client'

import { useMemo } from 'react'
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { Expense } from '@/lib/expense-types'

interface SummaryCardsProps {
  expenses: Expense[]
}

export function SummaryCards({ expenses }: SummaryCardsProps) {
  const { daily, weekly, monthly } = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    let daily = 0
    let weekly = 0
    let monthly = 0

    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date)
      const expenseAmount = expense.amount
      
      if (expenseDate >= today) {
        daily += expenseAmount
      }
      if (expenseDate >= weekAgo) {
        weekly += expenseAmount
      }
      if (expenseDate >= monthAgo) {
        monthly += expenseAmount
      }
    })

    return { daily, weekly, monthly }
  }, [expenses])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const cards = [
    {
      label: 'Daily Expense',
      amount: daily,
      icon: Calendar,
      gradient: 'from-chart-1/20 to-transparent',
      iconColor: 'text-chart-1',
    },
    {
      label: 'Weekly Expense',
      amount: weekly,
      icon: CalendarDays,
      gradient: 'from-chart-2/20 to-transparent',
      iconColor: 'text-chart-2',
    },
    {
      label: 'Monthly Expense',
      amount: monthly,
      icon: CalendarRange,
      gradient: 'from-chart-3/20 to-transparent',
      iconColor: 'text-chart-3',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Card 
          key={card.label} 
          className={`border-border/50 bg-gradient-to-br ${card.gradient}`}
        >
          <CardContent className="flex items-center gap-4 pt-6">
            <div className={`rounded-lg bg-secondary/50 p-3 ${card.iconColor}`}>
              <card.icon className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-bold">{formatCurrency(card.amount)}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
