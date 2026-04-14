'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { Wallet, BarChart3, Settings, Download, LogOut, RotateCcw } from 'lucide-react'
import { auth } from '@/lib/firebase'
import {
  subscribeExpenses,
  addExpense,
  updateExpense,
  deleteExpense as deleteExpenseDoc,
  subscribeCategories,
  addCategory as addCategoryDoc,
  deleteCategory as deleteCategoryDoc,
  seedDefaultCategories,
  subscribeUserSettings,
  updateUserSettings,
  batchUpdateExpenseCycleLabels,
  deleteAllUserData,
} from '@/lib/firestore'
import { getExpenseCycleLabel, getExpenseCategories } from '@/lib/utils'
import { Sidebar, MobileNav, type Section } from '@/components/sidebar'
import { ExpenseForm } from '@/components/expense-form'
import { SummaryCards } from '@/components/summary-cards'
import { ExpenseFilters } from '@/components/expense-filters'
import { ExpenseTable } from '@/components/expense-table'
import { ExpenseCharts } from '@/components/expense-charts'
import { Settings as SettingsPanel } from '@/components/settings'
import { EditExpenseDrawer } from '@/components/edit-expense-drawer'
import { LoginScreen } from '@/components/login-screen'
import { OnboardingDialog } from '@/components/onboarding-dialog'
import { ResetMonthDialog } from '@/components/reset-month-dialog'
import { Button } from '@/components/ui/button'
import type { Expense, CategoryItem, UserSettings } from '@/lib/expense-types'
import { DEFAULT_CATEGORIES } from '@/lib/expense-types'
import { exportExpensesToExcel } from '@/lib/export'

export default function ExpenseManager() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [activeSection, setActiveSection] = useState<Section>('expenses')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [monthFilter, setMonthFilter] = useState<string | 'All'>('All')

  // User settings (salary cycle)
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  // Edit drawer state
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthLoading(false)
    })
    return unsub
  }, [])

  // Subscribe to Firestore data when user is authenticated
  useEffect(() => {
    if (!user) {
      setExpenses([])
      setCategories([])
      setUserSettings(null)
      setSettingsLoaded(false)
      setIsLoaded(false)
      return
    }

    // Seed default categories for new users
    seedDefaultCategories(user.uid, DEFAULT_CATEGORIES)

    const unsubExpenses = subscribeExpenses(
      user.uid,
      (data) => {
        setExpenses(data)
        setIsLoaded(true)
      },
      (err) => console.error('Expenses subscription error:', err)
    )

    const unsubCategories = subscribeCategories(
      user.uid,
      (data) => {
        // Deduplicate by name (in case seed ran multiple times)
        const seen = new Set<string>()
        const unique = data.filter((cat) => {
          if (seen.has(cat.name)) return false
          seen.add(cat.name)
          return true
        })
        setCategories(unique)
      },
      (err) => console.error('Categories subscription error:', err)
    )

    const unsubSettings = subscribeUserSettings(
      user.uid,
      (data) => {
        setUserSettings(data)
        setSettingsLoaded(true)
      },
      (err) => console.error('Settings subscription error:', err)
    )

    return () => {
      unsubExpenses()
      unsubCategories()
      unsubSettings()
    }
  }, [user])

  const handleAddExpense = useCallback(
    async (expense: Expense) => {
      if (!user) return
      const { id, ...data } = expense
      await addExpense(user.uid, data)
    },
    [user]
  )

  const handleEditExpense = useCallback((expense: Expense) => {
    setEditingExpense(expense)
    setEditDrawerOpen(true)
  }, [])

  const handleSaveExpense = useCallback(
    async (expense: Expense) => {
      if (!user) return
      await updateExpense(user.uid, expense.id, expense)
    },
    [user]
  )

  const handleDeleteExpense = useCallback(
    async (id: string) => {
      if (!user) return
      await deleteExpenseDoc(user.uid, id)
    },
    [user]
  )

  const handleAddCategory = useCallback(
    async (category: CategoryItem) => {
      if (!user) return
      await addCategoryDoc(user.uid, category)
    },
    [user]
  )

  const handleDeleteCategory = useCallback(
    async (name: string) => {
      if (!user) return
      await deleteCategoryDoc(user.uid, name)
    },
    [user]
  )

  const handleClearFilters = useCallback(() => {
    setCategoryFilter([])
    setMonthFilter('All')
  }, [])

  // Onboarding handler
  const handleOnboardingComplete = useCallback(
    async (settings: UserSettings) => {
      if (!user) return
      
      // Save settings first
      await updateUserSettings(user.uid, settings)
      
      // Retroactively tag ALL existing expenses that fall after the cycle start
      if (expenses.length > 0) {
        await batchUpdateExpenseCycleLabels(
          user.uid,
          expenses,
          settings.currentCycleStart,
          settings.currentCycleLabel
        )
      }
    },
    [user, expenses]
  )

  // Reset month handler
  const handleResetMonth = useCallback(
    async (newSalary: number, newCycleLabel: string) => {
      if (!user) return
      const now = new Date()

      await updateUserSettings(user.uid, {
        currentCycleStart: now.toISOString(),
        currentCycleLabel: newCycleLabel,
        salary: newSalary,
      })
    },
    [user]
  )

  // Compute cycle spent (for reset dialog)
  const cycleSpent = useMemo(() => {
    if (!userSettings) return 0
    return expenses.reduce((total, expense) => {
      if (getExpenseCycleLabel(expense) === userSettings.currentCycleLabel) {
        return total + expense.amount
      }
      return total
    }, 0)
  }, [expenses, userSettings])

  // Filter expenses based on category and cycle label
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (categoryFilter.length > 0) {
        const cats = getExpenseCategories(expense)
        if (!cats.some((c) => categoryFilter.includes(c))) return false
      }
      if (monthFilter !== 'All') {
        const label = getExpenseCycleLabel(expense)
        if (label !== monthFilter) return false
      }
      return true
    })
  }, [expenses, categoryFilter, monthFilter])

  // Sort by most recent first
  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => b.timestamp - a.timestamp)
  }, [filteredExpenses])

  const handleExport = useCallback(() => {
    exportExpensesToExcel(filteredExpenses, monthFilter, categoryFilter)
  }, [filteredExpenses, monthFilter, categoryFilter])

  const handleSignOut = useCallback(() => {
    setActiveSection('expenses')
    signOut(auth)
  }, [])

  // Factory reset — delete all user data then sign out
  const handleResetAccount = useCallback(async () => {
    if (!user) return
    await deleteAllUserData(user.uid)
    setActiveSection('expenses')
    await signOut(auth)
  }, [user])

  // Auth loading
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Not signed in
  if (!user) {
    return <LoginScreen />
  }

  // Data loading (Firestore first load)
  if (!isLoaded || !settingsLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading your expenses...</div>
      </div>
    )
  }

  // Show onboarding for first-time users
  const showOnboarding = settingsLoaded && !userSettings?.isOnboarded

  return (
    <div className="min-h-screen bg-background">
      {/* Onboarding Dialog */}
      <OnboardingDialog open={showOnboarding} onComplete={handleOnboardingComplete} />
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      </div>

      {/* Mobile Navigation */}
      <MobileNav activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main Content */}
      <main className="pb-20 lg:ml-64 lg:pb-0">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {activeSection === 'expenses' && (
            <>
              {/* Expense Manager Header */}
              <header className="mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Wallet className="size-6 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">Expense Manager</h1>
                      <p className="text-sm text-muted-foreground">Track your daily spending</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {userSettings && (
                      <ResetMonthDialog
                        userSettings={userSettings}
                        cycleSpent={cycleSpent}
                        onConfirm={handleResetMonth}
                      >
                        <Button variant="outline" size="sm" title="Reset Month">
                          <RotateCcw className="size-4" />
                          <span className="hidden sm:inline">Reset Month</span>
                        </Button>
                      </ResetMonthDialog>
                    )}
                    <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="size-4" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleSignOut} title="Sign out">
                      <LogOut className="size-4" />
                    </Button>
                  </div>
                </div>
              </header>

              <div className="space-y-6">
                <ExpenseForm onAddExpense={handleAddExpense} categories={categories} currentCycleLabel={userSettings?.currentCycleLabel} />
                <SummaryCards expenses={expenses} userSettings={userSettings} />
                <ExpenseFilters
                  categoryFilter={categoryFilter}
                  onCategoryChange={setCategoryFilter}
                  monthFilter={monthFilter}
                  onMonthChange={setMonthFilter}
                  onClearFilters={handleClearFilters}
                  categories={categories}
                  expenses={expenses}
                />
                <ExpenseTable
                  expenses={sortedExpenses}
                  onDeleteExpense={handleDeleteExpense}
                  onEditExpense={handleEditExpense}
                  categories={categories}
                />
              </div>
            </>
          )}

          {activeSection === 'visuals' && (
            <>
              <header className="mb-8">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <BarChart3 className="size-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Visuals</h1>
                    <p className="text-sm text-muted-foreground">Charts & analytics</p>
                  </div>
                </div>
              </header>

              <ExpenseCharts expenses={expenses} categories={categories} />
            </>
          )}

          {activeSection === 'settings' && (
            <>
              <header className="mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Settings className="size-6 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                      <p className="text-sm text-muted-foreground">Categories & preferences</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleSignOut} className="lg:hidden" title="Sign out">
                    <LogOut className="size-4" />
                    Sign out
                  </Button>
                </div>
              </header>

              <SettingsPanel
                categories={categories}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
                expenses={expenses}
                onResetAccount={handleResetAccount}
              />
            </>
          )}
        </div>
      </main>

      {/* Edit Expense Drawer */}
      <EditExpenseDrawer
        expense={editingExpense}
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        onSave={handleSaveExpense}
        categories={categories}
      />
    </div>
  )
}
