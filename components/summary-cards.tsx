'use client'

import { useMemo } from 'react'
import { Calendar, CalendarDays, CalendarRange, Wallet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getExpenseCycleLabel } from '@/lib/utils'
import type { Expense, UserSettings } from '@/lib/expense-types'

interface SummaryCardsProps {
  expenses: Expense[]
  userSettings?: UserSettings | null
}

export function SummaryCards({ expenses, userSettings }: SummaryCardsProps) {
  const { daily, weekly, cycleSpent } = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Week starts on Monday — find the most recent Monday at 00:00
    const dayOfWeek = today.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const weekStart = new Date(today.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000)

    let daily = 0
    let weekly = 0
    let cycleSpent = 0

    const currentLabel = userSettings?.currentCycleLabel

    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date)
      const expenseAmount = expense.amount
      
      if (expenseDate >= today) {
        daily += expenseAmount
      }
      if (expenseDate >= weekStart) {
        weekly += expenseAmount
      }
      if (currentLabel && getExpenseCycleLabel(expense) === currentLabel) {
        cycleSpent += expenseAmount
      }
    })

    return { daily, weekly, cycleSpent }
  }, [expenses, userSettings])

  const salary = userSettings?.salary ?? 0
  const remaining = salary - cycleSpent
  const remainingPercentage = salary > 0 ? (remaining / salary) * 100 : 100

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const remainingColor =
    remainingPercentage > 30
      ? 'text-emerald-500'
      : remainingPercentage > 10
        ? 'text-amber-500'
        : 'text-destructive'

  const remainingGradient =
    remainingPercentage > 30
      ? 'from-emerald-500/20 to-transparent'
      : remainingPercentage > 10
        ? 'from-amber-500/20 to-transparent'
        : 'from-destructive/20 to-transparent'

  const cards = [
    {
      label: 'Daily Expense',
      amount: formatCurrency(daily),
      icon: Calendar,
      gradient: 'from-chart-1/20 to-transparent',
      iconColor: 'text-chart-1',
      amountColor: '',
    },
    {
      label: 'Weekly Expense',
      amount: formatCurrency(weekly),
      icon: CalendarDays,
      gradient: 'from-chart-2/20 to-transparent',
      iconColor: 'text-chart-2',
      amountColor: '',
    },
    {
      label: userSettings?.currentCycleLabel
        ? `${userSettings.currentCycleLabel} Spent`
        : 'Monthly Expense',
      amount: formatCurrency(cycleSpent),
      icon: CalendarRange,
      gradient: 'from-chart-3/20 to-transparent',
      iconColor: 'text-chart-3',
      amountColor: '',
    },
    ...(userSettings && userSettings.salary > 0
      ? [
          {
            label: 'Remaining Budget',
            amount: formatCurrency(remaining),
            icon: Wallet,
            gradient: remainingGradient,
            iconColor: remainingColor,
            amountColor: remainingColor,
          },
        ]
      : []),
  ]

  const hasBudget = userSettings && userSettings.salary > 0

  return (
    <div className={`grid grid-cols-2 gap-4 ${hasBudget ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
      {cards.map((card) => (
        <Card 
          key={card.label} 
          className={`border-border/50 bg-gradient-to-br ${card.gradient}`}
        >
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:pt-6">
            <div className={`rounded-lg bg-secondary/50 p-2 sm:p-3 ${card.iconColor}`}>
              <card.icon className="size-4 sm:size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{card.label}</p>
              <p className={`text-lg sm:text-2xl font-bold ${card.amountColor}`}>{card.amount}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
