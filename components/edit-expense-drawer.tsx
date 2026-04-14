'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon, Check } from 'lucide-react'
import { format } from 'date-fns'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Calendar } from '@/components/ui/calendar'
import { cn, getExpenseCycleLabel, getExpenseCategories } from '@/lib/utils'
import type { Expense, CategoryItem } from '@/lib/expense-types'

interface EditExpenseDrawerProps {
  expense: Expense | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (expense: Expense) => void
  categories: CategoryItem[]
}

export function EditExpenseDrawer({
  expense,
  open,
  onOpenChange,
  onSave,
  categories,
}: EditExpenseDrawerProps) {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  useEffect(() => {
    if (expense) {
      setTitle(expense.title)
      setAmount(String(expense.amount))
      setSelectedCategories(getExpenseCategories(expense))
      setSelectedDate(new Date(expense.date))
    }
  }, [expense])

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    )
  }

  const handleSave = () => {
    if (!expense || !title.trim() || !amount || selectedCategories.length === 0) return

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 10_000_000) return

    const sanitizedTitle = title.trim().slice(0, 100)
    const expenseDate = selectedDate ?? new Date(expense.date)
    if (isNaN(expenseDate.getTime()) || expenseDate > new Date()) return

    onSave({
      ...expense,
      title: sanitizedTitle,
      amount: Math.round(parsedAmount * 100) / 100,
      category: selectedCategories.length === 1 ? selectedCategories[0] : selectedCategories,
      date: expenseDate.toISOString(),
    })
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Edit Expense</DrawerTitle>
            <DrawerDescription>Update the expense details</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">{"Amount (₹)"}</label>
              <Input
                type="number"
                min="0.01"
                max="10000000"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Category</label>
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
                        {selectedCategories.map((c) => (
                          <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                        ))}
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Date</label>
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
                    {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
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
            {expense && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Cycle</label>
                <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                  {getExpenseCycleLabel(expense)}
                </div>
              </div>
            )}
          </div>
          <DrawerFooter>
            <Button onClick={handleSave}>Save Changes</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
