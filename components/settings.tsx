'use client'

import { useState } from 'react'
import { Plus, Trash2, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { CategoryItem, Expense } from '@/lib/expense-types'
import { CATEGORY_COLOR_PALETTE } from '@/lib/expense-types'

interface SettingsProps {
  categories: CategoryItem[]
  onAddCategory: (category: CategoryItem) => void
  onDeleteCategory: (name: string) => void
  expenses: Expense[]
}

export function Settings({ categories, onAddCategory, onDeleteCategory, expenses }: SettingsProps) {
  const [newCategoryName, setNewCategoryName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const isCategoryInUse = (name: string) => {
    return expenses.some((e) => e.category === name)
  }

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newCategoryName.trim()
    if (!trimmed) return
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
              const usageCount = expenses.filter((e) => e.category === cat.name).length
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
    </div>
  )
}
