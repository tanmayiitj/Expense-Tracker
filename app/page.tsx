'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Wallet, Users } from 'lucide-react'
import { Sidebar, MobileNav, type Section } from '@/components/sidebar'
import { ExpenseForm } from '@/components/expense-form'
import { SummaryCards } from '@/components/summary-cards'
import { ExpenseFilters } from '@/components/expense-filters'
import { ExpenseTable } from '@/components/expense-table'
import { ExpenseCharts } from '@/components/expense-charts'
import { SplitTracker } from '@/components/split-tracker'
import type { Expense, Category, Split } from '@/lib/expense-types'

const EXPENSES_KEY = 'smart-expense-manager-expenses'
const SPLITS_KEY = 'smart-expense-manager-splits'

export default function ExpenseManager() {
  const [activeSection, setActiveSection] = useState<Section>('expenses')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [splits, setSplits] = useState<Split[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All')
  const [monthFilter, setMonthFilter] = useState<number | 'All'>('All')

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const storedExpenses = localStorage.getItem(EXPENSES_KEY)
      const storedSplits = localStorage.getItem(SPLITS_KEY)
      if (storedExpenses) {
        setExpenses(JSON.parse(storedExpenses) as Expense[])
      }
      if (storedSplits) {
        setSplits(JSON.parse(storedSplits) as Split[])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    }
    setIsLoaded(true)
  }, [])

  // Save expenses to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses))
    }
  }, [expenses, isLoaded])

  // Save splits to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(SPLITS_KEY, JSON.stringify(splits))
    }
  }, [splits, isLoaded])

  const handleAddExpense = useCallback((expense: Expense) => {
    setExpenses((prev) => [expense, ...prev])
  }, [])

  const handleDeleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
    // Also delete related splits
    setSplits((prev) => prev.filter((s) => s.expenseId !== id))
  }, [])

  const handleAddSplits = useCallback((newSplits: Split[]) => {
    setSplits((prev) => [...newSplits, ...prev])
  }, [])

  const handleAddSplit = useCallback((split: Split) => {
    setSplits((prev) => [split, ...prev])
  }, [])

  const handleDeleteSplit = useCallback((id: string) => {
    setSplits((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const handleToggleSettled = useCallback((id: string) => {
    setSplits((prev) =>
      prev.map((s) => (s.id === id ? { ...s, settled: !s.settled } : s))
    )
  }, [])

  const handleClearFilters = useCallback(() => {
    setCategoryFilter('All')
    setMonthFilter('All')
  }, [])

  // Filter expenses based on category and month
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      // Category filter
      if (categoryFilter !== 'All' && expense.category !== categoryFilter) {
        return false
      }

      // Month filter
      if (monthFilter !== 'All') {
        const expenseMonth = new Date(expense.date).getMonth()
        if (expenseMonth !== monthFilter) return false
      }

      return true
    })
  }, [expenses, categoryFilter, monthFilter])

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
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      </div>

      {/* Mobile Navigation */}
      <MobileNav activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main Content */}
      <main className="pb-20 lg:ml-64 lg:pb-0">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {activeSection === 'expenses' ? (
            <>
              {/* Expense Manager Header */}
              <header className="mb-8">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Wallet className="size-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Expense Manager</h1>
                    <p className="text-sm text-muted-foreground">Track your daily spending</p>
                  </div>
                </div>
              </header>

              <div className="space-y-6">
                {/* Expense Input Form */}
                <ExpenseForm onAddExpense={handleAddExpense} onAddSplits={handleAddSplits} />

                {/* Summary Cards */}
                <SummaryCards expenses={expenses} />

                {/* Charts */}
                <ExpenseCharts expenses={expenses} />

                {/* Filters */}
                <ExpenseFilters
                  categoryFilter={categoryFilter}
                  onCategoryChange={setCategoryFilter}
                  monthFilter={monthFilter}
                  onMonthChange={setMonthFilter}
                  onClearFilters={handleClearFilters}
                />

                {/* Expense Table */}
                <ExpenseTable expenses={sortedExpenses} onDeleteExpense={handleDeleteExpense} />
              </div>
            </>
          ) : (
            <>
              {/* Split Tracker Header */}
              <header className="mb-8">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Users className="size-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Split Tracker</h1>
                    <p className="text-sm text-muted-foreground">Track who owes whom</p>
                  </div>
                </div>
              </header>

              <SplitTracker
                splits={splits}
                onAddSplit={handleAddSplit}
                onDeleteSplit={handleDeleteSplit}
                onToggleSettled={handleToggleSettled}
              />
            </>
          )}
        </div>
      </main>
    </div>
  )
}
