'use client'

import { useState, useCallback } from 'react'
import { Plus, CalendarIcon, Check } from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  const resetForm = useCallback(() => {
    setTitle('')
    setAmount('')
    setSelectedCategories([])
    setSelectedDate(undefined)
  }, [])

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !amount || selectedCategories.length === 0) return

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 10_000_000) return

    const sanitizedTitle = title.trim().slice(0, 100)
    const expenseDate = selectedDate ? new Date(selectedDate) : new Date()
    if (isNaN(expenseDate.getTime()) || expenseDate > new Date()) return

    const expense: Expense = {
      id: crypto.randomUUID(),
      title: sanitizedTitle,
      amount: Math.round(parsedAmount * 100) / 100,
      category: selectedCategories.length === 1 ? selectedCategories[0] : selectedCategories,
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
                maxLength={100}
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
                min="0.01"
                max="10000000"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
            <div className="w-full sm:w-48 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Category
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-secondary/50"
                  >
                    {selectedCategories.length === 0 ? (
                      <span className="text-muted-foreground">Select...</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {selectedCategories.length <= 2 ? (
                          selectedCategories.map((c) => (
                            <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                          ))
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {selectedCategories.length} selected
                          </Badge>
                        )}
                      </div>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup>
                        {categories.map((cat) => (
                          <CommandItem
                            key={cat.name}
                            onSelect={() => toggleCategory(cat.name)}
                          >
                            <Check
                              className={cn(
                                'mr-2 size-4',
                                selectedCategories.includes(cat.name) ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {cat.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
