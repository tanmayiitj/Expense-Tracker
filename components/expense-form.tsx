'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CATEGORIES, type Category, type Expense } from '@/lib/expense-types'

interface ExpenseFormProps {
  onAddExpense: (expense: Expense) => void
}

export function ExpenseForm({ onAddExpense }: ExpenseFormProps) {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category | ''>('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !amount || !category) return

    const expense: Expense = {
      id: crypto.randomUUID(),
      title: title.trim(),
      amount: parseFloat(amount),
      category: category as Category,
      date: new Date().toISOString(),
      timestamp: Date.now(),
    }

    onAddExpense(expense)
    setTitle('')
    setAmount('')
    setCategory('')
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Add New Expense</CardTitle>
        <CardDescription>Track your daily spending</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Expense Title
            </label>
            <Input
              placeholder="e.g., Coffee, Groceries..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-secondary/50"
            />
          </div>
          <div className="w-full sm:w-32 space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {"Amount (₹)"}
            </label>
            <Input
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-secondary/50"
            />
          </div>
          <div className="w-full sm:w-40 space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Category
            </label>
            <Select value={category} onValueChange={(val) => setCategory(val as Category)}>
              <SelectTrigger className="w-full bg-secondary/50">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full sm:w-auto">
            <Plus className="size-4" />
            Add Expense
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
