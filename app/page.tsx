'use client'

import { useState, useEffect, useMemo } from 'react'
import { Wallet } from 'lucide-react'
import { ExpenseForm } from '@/components/expense-form'
import { SummaryCards } from '@/components/summary-cards'
import { ExpenseFilters } from '@/components/expense-filters'
import { ExpenseTable } from '@/components/expense-table'
import { ExpenseCharts } from '@/components/expense-charts'
import type { Expense, Category } from '@/lib/expense-types'

const STORAGE_KEY = 'expense-manager-data'

export default function ExpenseManager() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Load expenses from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Expense[]
        setExpenses(parsed)
      }
    } catch (error) {
      console.error('Failed to load expenses:', error)
    }
    setIsLoaded(true)
  }, [])

  // Save expenses to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses))
    }
  }, [expenses, isLoaded])

  const handleAddExpense = (expense: Expense) => {
    setExpenses((prev) => [expense, ...prev])
  }

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  const handleClearFilters = () => {
    setCategoryFilter('All')
    setStartDate('')
    setEndDate('')
  }

  // Filter expenses based on category and date range
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      // Category filter
      if (categoryFilter !== 'All' && expense.category !== categoryFilter) {
        return false
      }

      // Date range filter
      const expenseDate = new Date(expense.date)
      
      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        if (expenseDate < start) return false
      }
      
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        if (expenseDate > end) return false
      }

      return true
    })
  }, [expenses, categoryFilter, startDate, endDate])

  // Sort by most recent first
  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => b.timestamp - a.timestamp)
  }, [filteredExpenses])

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Wallet className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Daily Expense Manager</h1>
              <p className="text-sm text-muted-foreground">Track your spending smartly</p>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {/* Expense Input Form */}
          <ExpenseForm onAddExpense={handleAddExpense} />

          {/* Summary Cards */}
          <SummaryCards expenses={expenses} />

          {/* Charts */}
          <ExpenseCharts expenses={expenses} />

          {/* Filters */}
          <ExpenseFilters
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onClearFilters={handleClearFilters}
          />

          {/* Expense Table */}
          <ExpenseTable expenses={sortedExpenses} onDeleteExpense={handleDeleteExpense} />
        </div>
      </div>
    </main>
  )
}
