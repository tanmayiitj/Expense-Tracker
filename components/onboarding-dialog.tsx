'use client'

import { useState } from 'react'
import { CalendarIcon, IndianRupee, Wallet } from 'lucide-react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn, getCycleLabel } from '@/lib/utils'
import type { UserSettings } from '@/lib/expense-types'

interface OnboardingDialogProps {
  open: boolean
  onComplete: (settings: UserSettings) => void
}

export function OnboardingDialog({ open, onComplete }: OnboardingDialogProps) {
  const [salaryDate, setSalaryDate] = useState<Date | undefined>(undefined)
  const [salary, setSalary] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!salaryDate) return

    const parsedSalary = parseFloat(salary) || 0

    // Cycle label = month AFTER the salary date's month
    // e.g., salary on March 30 → cycle = "April 2026"
    const nextMonth = new Date(salaryDate)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    nextMonth.setDate(1)

    const settings: UserSettings = {
      currentCycleStart: salaryDate.toISOString(),
      currentCycleLabel: getCycleLabel(nextMonth),
      salary: parsedSalary,
      isOnboarded: true,
    }

    onComplete(settings)
  }

  const computedCycleLabel = salaryDate
    ? (() => {
        const nextMonth = new Date(salaryDate)
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        nextMonth.setDate(1)
        return getCycleLabel(nextMonth)
      })()
    : null

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <div className="mx-auto mb-2 rounded-full bg-primary/10 p-3 w-fit">
            <Wallet className="size-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">Welcome to Smart Expense!</DialogTitle>
          <DialogDescription>
            Set up your salary cycle so expenses are grouped correctly. For example, if you got paid on March 30, all spending after that counts as April expenses — until your next salary arrives.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              When did you last receive your salary? <span className="text-destructive">*</span>
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !salaryDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="size-4" />
                  {salaryDate ? format(salaryDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={salaryDate}
                  onSelect={setSalaryDate}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Monthly salary <span className="text-xs text-muted-foreground">(optional)</span>
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                placeholder="e.g., 50000"
                min="0"
                step="1"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              If provided, you&apos;ll see a remaining budget tracker. You can always add this later.
            </p>
          </div>

          {computedCycleLabel && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-sm text-muted-foreground">
                Your current spending cycle will be{' '}
                <span className="font-semibold text-foreground">{computedCycleLabel}</span>
                {salary && parseFloat(salary) > 0 && (
                  <>
                    {' '}with a budget of{' '}
                    <span className="font-semibold text-foreground">
                      ₹{parseFloat(salary).toLocaleString('en-IN')}
                    </span>
                  </>
                )}
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!salaryDate}
          >
            Get Started
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
