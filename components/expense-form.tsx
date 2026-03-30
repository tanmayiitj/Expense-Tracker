'use client'

import { useState, useCallback } from 'react'
import { Plus, Minus, CalendarIcon } from 'lucide-react'
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
import { CATEGORIES, type Category, type Expense, type Split, type SplitType, type SplitPerson } from '@/lib/expense-types'

interface ExpenseFormProps {
  onAddExpense: (expense: Expense) => void
  onAddSplits: (splits: Split[]) => void
}

export function ExpenseForm({ onAddExpense, onAddSplits }: ExpenseFormProps) {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  
  // Travel split state
  const [splitType, setSplitType] = useState<SplitType>('paid')
  const [splitCount, setSplitCount] = useState(2)
  const [splitPeople, setSplitPeople] = useState<string[]>([''])
  const [owePerson, setOwePerson] = useState('')
  const [oweAmount, setOweAmount] = useState('')

  const resetForm = useCallback(() => {
    setTitle('')
    setAmount('')
    setCategory('')
    setSelectedDate(undefined)
    setSplitType('paid')
    setSplitCount(2)
    setSplitPeople([''])
    setOwePerson('')
    setOweAmount('')
  }, [])

  const handleSplitCountChange = (count: number) => {
    const newCount = Math.max(2, Math.min(10, count))
    setSplitCount(newCount)
    const otherPeople = newCount - 1
    setSplitPeople(prev => {
      const newPeople = [...prev]
      while (newPeople.length < otherPeople) newPeople.push('')
      return newPeople.slice(0, otherPeople)
    })
  }

  const handlePersonNameChange = (index: number, name: string) => {
    setSplitPeople(prev => {
      const newPeople = [...prev]
      newPeople[index] = name
      return newPeople
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !amount || !category) return

    const parsedAmount = parseFloat(amount)
    // Use selected date if provided, otherwise use current date/time
    const expenseDate = selectedDate ? new Date(selectedDate) : new Date()
    const expenseId = crypto.randomUUID()

    if (category === 'Travel') {
      if (splitType === 'paid') {
        // User paid, others owe them
        const splitAmount = Math.round((parsedAmount / splitCount) * 100) / 100
        const validPeople = splitPeople.filter(p => p.trim())
        
        if (validPeople.length === 0) return

        const splitPersons: SplitPerson[] = validPeople.map(name => ({
          name: name.trim(),
          amount: splitAmount,
        }))

        // Your actual expense is only your share (total / splitCount)
        const myShare = splitAmount

        const expense: Expense = {
          id: expenseId,
          title: title.trim(),
          amount: parsedAmount, // Total amount paid
          actualAmount: myShare, // Your actual expense (your share)
          category,
          date: expenseDate.toISOString(),
          timestamp: Date.now(),
          splitDetails: {
            type: 'paid',
            splitCount,
            people: splitPersons,
          },
        }

        const splits: Split[] = validPeople.map(name => ({
          id: crypto.randomUUID(),
          personName: name.trim(),
          amount: splitAmount,
          type: 'they_owe_me',
          description: `Split from: ${title.trim()}`,
          date: expenseDate.toISOString(),
          timestamp: Date.now(),
          settled: false,
          expenseId,
        }))

        onAddExpense(expense)
        onAddSplits(splits)
      } else {
        // User owes someone else
        if (!owePerson.trim() || !oweAmount) return

        const oweAmountParsed = parseFloat(oweAmount)

        // When you owe someone, your actual expense is what you owe
        const expense: Expense = {
          id: expenseId,
          title: title.trim(),
          amount: parsedAmount, // Total amount (for reference)
          actualAmount: oweAmountParsed, // Your actual expense (what you owe)
          category,
          date: expenseDate.toISOString(),
          timestamp: Date.now(),
          splitDetails: {
            type: 'owe',
            people: [{ name: owePerson.trim(), amount: oweAmountParsed }],
          },
        }

        const split: Split = {
          id: crypto.randomUUID(),
          personName: owePerson.trim(),
          amount: oweAmountParsed,
          type: 'i_owe_them',
          description: `${owePerson.trim()} paid for: ${title.trim()}`,
          date: expenseDate.toISOString(),
          timestamp: Date.now(),
          settled: false,
          expenseId,
        }

        onAddExpense(expense)
        onAddSplits([split])
      }
    } else {
      // Non-travel expense - actualAmount equals amount
      const expense: Expense = {
        id: expenseId,
        title: title.trim(),
        amount: parsedAmount,
        actualAmount: parsedAmount, // For non-split expenses, actual = total
        category: category as Category,
        date: expenseDate.toISOString(),
        timestamp: Date.now(),
      }
      onAddExpense(expense)
    }

    resetForm()
  }

  const splitAmount = amount && splitCount > 0 
    ? Math.round((parseFloat(amount) / splitCount) * 100) / 100 
    : 0

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

          {/* Travel Split Options */}
          {category === 'Travel' && (
            <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Payment Type:</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={splitType === 'paid' ? 'default' : 'outline'}
                    onClick={() => setSplitType('paid')}
                  >
                    I Paid
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={splitType === 'owe' ? 'default' : 'outline'}
                    onClick={() => setSplitType('owe')}
                  >
                    I Owe
                  </Button>
                </div>
              </div>

              {splitType === 'paid' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">Split between:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-8"
                        onClick={() => handleSplitCountChange(splitCount - 1)}
                      >
                        <Minus className="size-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{splitCount}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-8"
                        onClick={() => handleSplitCountChange(splitCount + 1)}
                      >
                        <Plus className="size-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">people</span>
                    </div>
                  </div>

                  {amount && (
                    <p className="text-sm text-primary">
                      Each person owes: ₹{splitAmount.toLocaleString('en-IN')}
                    </p>
                  )}

                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {splitPeople.map((person, index) => (
                      <Input
                        key={index}
                        placeholder={`Person ${index + 1} name`}
                        value={person}
                        onChange={(e) => handlePersonNameChange(index, e.target.value)}
                        className="bg-secondary/50"
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm text-muted-foreground">
                      Who paid?
                    </label>
                    <Input
                      placeholder="Person name"
                      value={owePerson}
                      onChange={(e) => setOwePerson(e.target.value)}
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="w-full sm:w-32 space-y-2">
                    <label className="text-sm text-muted-foreground">
                      {"Amount I owe (₹)"}
                    </label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={oweAmount}
                      onChange={(e) => setOweAmount(e.target.value)}
                      className="bg-secondary/50"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <Button type="submit" className="w-full sm:w-auto">
            <Plus className="size-4" />
            Add Expense
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
