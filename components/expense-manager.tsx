'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import dynamic from 'next/dynamic'
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
import { LoginScreen } from '@/components/login-screen'
import { OnboardingDialog } from '@/components/onboarding-dialog'
import { ResetMonthDialog } from '@/components/reset-month-dialog'
import { PassphraseDialog } from '@/components/passphrase-dialog'
import { Button } from '@/components/ui/button'
import type { Expense, CategoryItem, UserSettings } from '@/lib/expense-types'
import { DEFAULT_CATEGORIES } from '@/lib/expense-types'
import { deriveKey, createVerifyToken, verifyPassphrase, encryptExpense, decryptExpense } from '@/lib/crypto'

// Lazy-load heavy tab components (recharts, xlsx, etc.)
const ExpenseCharts = dynamic(() => import('@/components/expense-charts').then(m => ({ default: m.ExpenseCharts })), {
  loading: () => <div className="flex h-64 items-center justify-center text-muted-foreground animate-pulse">Loading charts...</div>,
})
const SettingsPanel = dynamic(() => import('@/components/settings').then(m => ({ default: m.Settings })), {
  loading: () => <div className="flex h-64 items-center justify-center text-muted-foreground animate-pulse">Loading settings...</div>,
})
const EditExpenseDrawer = dynamic(() => import('@/components/edit-expense-drawer').then(m => ({ default: m.EditExpenseDrawer })), {
  ssr: false,
})

export default function ExpenseManager() {
  // Optimistic auth: use cached currentUser immediately so returning users
  // skip the loading spinner. onAuthStateChanged will correct if needed.
  const [user, setUser] = useState<User | null>(auth.currentUser)
  const [authLoading, setAuthLoading] = useState(!auth.currentUser)

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

  // Account reset state
  const [resettingAccount, setResettingAccount] = useState(false)

  // Encryption state
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null)
  const [rawExpenses, setRawExpenses] = useState<Expense[]>([])

  // Determine if encryption is ready
  const needsPassphrase = settingsLoaded && userSettings?.encryptionEnabled && !encryptionKey

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
      setRawExpenses([])
      setCategories([])
      setUserSettings(null)
      setSettingsLoaded(false)
      setIsLoaded(false)
      setEncryptionKey(null)
      return
    }

    // Seed default categories for new users
    seedDefaultCategories(user.uid, DEFAULT_CATEGORIES)

    const unsubExpenses = subscribeExpenses(
      user.uid,
      (data) => {
        setRawExpenses(data)
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

  // Decrypt raw expenses when key is available or encryption is off
  useEffect(() => {
    if (!isLoaded) return

    if (!userSettings?.encryptionEnabled) {
      setExpenses(rawExpenses)
      return
    }

    if (!encryptionKey) return // wait for passphrase

    let cancelled = false
    Promise.all(rawExpenses.map((e) => decryptExpense(e, encryptionKey))).then((decrypted) => {
      if (!cancelled) setExpenses(decrypted)
    })
    return () => { cancelled = true }
  }, [rawExpenses, encryptionKey, userSettings?.encryptionEnabled, isLoaded])

  const handleAddExpense = useCallback(
    async (expense: Expense) => {
      if (!user) return
      const { id, ...data } = expense
      const toStore = encryptionKey ? await encryptExpense(data, encryptionKey) : data
      await addExpense(user.uid, toStore)
    },
    [user, encryptionKey]
  )

  const handleEditExpense = useCallback((expense: Expense) => {
    setEditingExpense(expense)
    setEditDrawerOpen(true)
  }, [])

  const handleSaveExpense = useCallback(
    async (expense: Expense) => {
      if (!user) return
      const toStore = encryptionKey ? await encryptExpense(expense, encryptionKey) : expense
      await updateExpense(user.uid, toStore.id, toStore)
    },
    [user, encryptionKey]
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
    async (settings: UserSettings, passphrase?: string) => {
      if (!user) return

      // If passphrase provided, derive key and create verify token
      if (passphrase) {
        const key = await deriveKey(passphrase, user.uid)
        const verifyToken = await createVerifyToken(key)
        settings.encryptionVerify = verifyToken
        setEncryptionKey(key)
      }
      
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

  const handleExport = useCallback(async () => {
    const { exportExpensesToExcel } = await import('@/lib/export')
    exportExpensesToExcel(filteredExpenses, monthFilter, categoryFilter)
  }, [filteredExpenses, monthFilter, categoryFilter])

  const handleSignOut = useCallback(() => {
    setActiveSection('expenses')
    setEncryptionKey(null)
    signOut(auth)
  }, [])

  // Factory reset — delete all user data then sign out
  const handleResetAccount = useCallback(async () => {
    if (!user) return
    setResettingAccount(true)
    try {
      await deleteAllUserData(user.uid)
      setActiveSection('expenses')
      setEncryptionKey(null)
      await signOut(auth)
    } catch {
      setResettingAccount(false)
    }
  }, [user])

  // Passphrase unlock handler
  const handleUnlock = useCallback(
    async (passphrase: string): Promise<boolean> => {
      if (!user || !userSettings?.encryptionVerify) return false
      const key = await deriveKey(passphrase, user.uid)
      const valid = await verifyPassphrase(key, userSettings.encryptionVerify)
      if (valid) {
        setEncryptionKey(key)
        return true
      }
      return false
    },
    [user, userSettings]
  )

  // Auth loading
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full size-8 border-2 border-muted-foreground border-t-primary" />
      </div>
    )
  }

  // Not signed in
  if (!user) {
    return <LoginScreen />
  }

  // Account deletion in progress — show loading until signOut completes
  if (resettingAccount) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <div className="animate-spin rounded-full size-8 border-2 border-muted-foreground border-t-primary" />
        <p className="text-muted-foreground">Deleting your account...</p>
      </div>
    )
  }

  // Data loading (Firestore first load)
  if (!isLoaded || !settingsLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <main className="lg:ml-64">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Header skeleton */}
            <div className="mb-8 flex items-center gap-3">
              <div className="size-10 rounded-lg bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-48 rounded bg-muted animate-pulse" />
                <div className="h-4 w-32 rounded bg-muted animate-pulse" />
              </div>
            </div>
            {/* Summary cards skeleton */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
                  <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                  <div className="h-7 w-28 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
            {/* Table skeleton */}
            <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Show onboarding for first-time users
  const showOnboarding = settingsLoaded && !userSettings?.isOnboarded

  return (
    <div className="min-h-screen bg-background">
      {/* Onboarding Dialog */}
      <OnboardingDialog open={showOnboarding} onComplete={handleOnboardingComplete} />

      {/* Passphrase Dialog for encrypted accounts */}
      <PassphraseDialog open={!!needsPassphrase} onUnlock={handleUnlock} />
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      </div>

      {/* Mobile Navigation */}
      <MobileNav activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main Content */}
      <main className="lg:ml-64 lg:pb-0" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
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
