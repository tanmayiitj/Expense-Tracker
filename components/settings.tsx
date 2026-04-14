'use client'

import { useState } from 'react'
import { Plus, Trash2, AlertTriangle, TriangleAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { CategoryItem, Expense } from '@/lib/expense-types'
import { CATEGORY_COLOR_PALETTE } from '@/lib/expense-types'
import { getExpenseCategories } from '@/lib/utils'

interface SettingsProps {
  categories: CategoryItem[]
  onAddCategory: (category: CategoryItem) => void
  onDeleteCategory: (name: string) => void
  expenses: Expense[]
  onResetAccount?: () => void
}

export function Settings({ categories, onAddCategory, onDeleteCategory, expenses, onResetAccount }: SettingsProps) {
  const [newCategoryName, setNewCategoryName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [resetConfirmInput, setResetConfirmInput] = useState('')
  const [resetDialogOpen, setResetDialogOpen] = useState(false)

  const isCategoryInUse = (name: string) => {
    return expenses.some((e) => getExpenseCategories(e).includes(name))
  }

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newCategoryName.trim().slice(0, 30)
    if (!trimmed) return
    if (categories.length >= 20) return // Max 20 categories
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) return

    const usedColors = new Set(categories.map((c) => c.color))
    const color = CATEGORY_COLOR_PALETTE.find((c) => !usedColors.has(c)) ?? CATEGORY_COLOR_PALETTE[0]
    onAddCategory({ name: trimmed, color })
    setNewCategoryName('')
  }

  const handleDelete = (name: string) => {
    if (isCategoryInUse(name) && deleteConfirm !== name) {
      setDeleteConfirm(name)
      return
    }
    onDeleteCategory(name)
    setDeleteConfirm(null)
  }

  return (
    <div className="space-y-6">
      {/* Add Category */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Add Category</CardTitle>
          <CardDescription>Create a new expense category</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddCategory} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Category Name</label>
              <Input
                placeholder="e.g., Entertainment, Health..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto">
              <Plus className="size-4" />
              Add Category
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Manage Categories */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Manage Categories</CardTitle>
          <CardDescription>{categories.length} categories configured</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categories.map((cat) => {
              const inUse = isCategoryInUse(cat.name)
              const usageCount = expenses.filter((e) => getExpenseCategories(e).includes(cat.name)).length
              return (
                <div
                  key={cat.name}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={`${cat.color} border-0`}>{cat.name}</Badge>
                    {inUse && (
                      <span className="text-xs text-muted-foreground">
                        {usageCount} expense{usageCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {deleteConfirm === cat.name && (
                      <span className="flex items-center gap-1 text-xs text-amber-500">
                        <AlertTriangle className="size-3" />
                        In use! Click again to confirm
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(cat.name)}
                      className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Delete {cat.name}</span>
                    </Button>
                  </div>
                </div>
              )
            })}
            {categories.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No categories. Add one above to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone — Reset Account */}
      {onResetAccount && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Permanently delete all your data and start fresh
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={resetDialogOpen} onOpenChange={(open) => {
              setResetDialogOpen(open)
              if (!open) setResetConfirmInput('')
            }}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  <TriangleAlert className="size-4" />
                  Reset Account
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <div className="mx-auto mb-2 rounded-full bg-destructive/10 p-3 w-fit">
                    <TriangleAlert className="size-6 text-destructive" />
                  </div>
                  <DialogTitle className="text-center">Reset Everything</DialogTitle>
                  <DialogDescription className="text-center">
                    This will permanently delete <span className="font-semibold text-foreground">all your expenses ({expenses.length})</span>, <span className="font-semibold text-foreground">all categories ({categories.length})</span>, and <span className="font-semibold text-foreground">your settings</span>. You will go through onboarding again. This cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <label className="text-sm font-medium">
                    Type <span className="font-mono text-destructive">delete everything</span> to confirm
                  </label>
                  <Input
                    placeholder="delete everything"
                    value={resetConfirmInput}
                    onChange={(e) => setResetConfirmInput(e.target.value)}
                    className="font-mono"
                    autoComplete="off"
                  />
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    onClick={() => setResetDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      onResetAccount()
                      setResetDialogOpen(false)
                      setResetConfirmInput('')
                    }}
                    disabled={resetConfirmInput.trim().toLowerCase() !== 'delete everything'}
                    className="w-full sm:w-auto"
                  >
                    Delete Everything
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
