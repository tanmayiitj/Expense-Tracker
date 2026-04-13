'use client'

import { useState, useCallback } from 'react'
import { Plus, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import type { Expense, CategoryItem } from '@/lib/expense-types'

interface ExpenseFormProps {
  onAddExpense: (expense: Expense) => void
  categories: CategoryItem[]
  currentCycleLabel?: string
}

export function ExpenseForm({ onAddExpense, categories, currentCycleLabel }: ExpenseFormProps) {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  const resetForm = useCallback(() => {
    setTitle('')
    setAmount('')
    setCategory('')
    setSelectedDate(undefined)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !amount || !category) return

    const parsedAmount = parseFloat(amount)
    const expenseDate = selectedDate ? new Date(selectedDate) : new Date()

    const expense: Expense = {
      id: crypto.randomUUID(),
      title: title.trim(),
      amount: parsedAmount,
      category,
      date: expenseDate.toISOString(),
      timestamp: Date.now(),
      ...(currentCycleLabel ? { cycleLabel: currentCycleLabel } : {}),
    }

    onAddExpense(expense)
    resetForm()
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Add New Expense</CardTitle>
        <CardDescription>Track your daily spending</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
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
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full bg-secondary/50">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.name} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-44 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Date (Optional)
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal bg-secondary/50',
                      !selectedDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="size-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : 'Today'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
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
