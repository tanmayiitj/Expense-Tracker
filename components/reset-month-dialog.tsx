'use client'

import { useState, useMemo } from 'react'
import { AlertTriangle, IndianRupee } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MONTHS } from '@/lib/expense-types'
import type { UserSettings } from '@/lib/expense-types'

interface ResetMonthDialogProps {
  userSettings: UserSettings
  cycleSpent: number
  onConfirm: (newSalary: number, newCycleLabel: string) => void
  children: React.ReactNode
}

function getNextCycleLabel(currentLabel: string): string {
  const parts = currentLabel.split(' ')
  const monthName = parts[0]
  const year = parseInt(parts[1])
  const monthIndex = MONTHS.indexOf(monthName)
  if (monthIndex === -1) return currentLabel

  const nextMonthIndex = (monthIndex + 1) % 12
  const nextYear = monthIndex === 11 ? year + 1 : year
  return `${MONTHS[nextMonthIndex]} ${nextYear}`
}

export function ResetMonthDialog({
  userSettings,
  cycleSpent,
  onConfirm,
  children,
}: ResetMonthDialogProps) {
  const [open, setOpen] = useState(false)
  const [confirmInput, setConfirmInput] = useState('')
  const [salary, setSalary] = useState('')

  const newCycleLabel = useMemo(
    () => getNextCycleLabel(userSettings.currentCycleLabel),
    [userSettings.currentCycleLabel]
  )

  const isConfirmed = confirmInput.trim().toLowerCase() === 'reset'

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleConfirm = () => {
    if (!isConfirmed) return
    const newSalary = parseFloat(salary) || userSettings.salary
    onConfirm(newSalary, newCycleLabel)
    setOpen(false)
    setConfirmInput('')
    setSalary('')
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setConfirmInput('')
      setSalary('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto mb-2 rounded-full bg-destructive/10 p-3 w-fit">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
          <DialogTitle className="text-center">Reset Monthly Expenditure</DialogTitle>
          <DialogDescription className="text-center">
            This will start a new spending cycle. All new expenses after this will belong to <span className="font-semibold text-foreground">{newCycleLabel}</span>. Existing expenses stay unchanged.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current cycle info */}
          <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current cycle</span>
              <span className="font-medium">{userSettings.currentCycleLabel}</span>
            </div>
            {userSettings.salary > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Budget</span>
                <span className="font-medium">{formatCurrency(userSettings.salary)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Spent</span>
              <span className="font-medium text-destructive">{formatCurrency(cycleSpent)}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-1 mt-1">
              <span className="text-muted-foreground">New cycle</span>
              <span className="font-semibold text-primary">{newCycleLabel}</span>
            </div>
          </div>

          {/* Optional salary update */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Update salary <span className="text-xs text-muted-foreground">(optional)</span>
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                placeholder={userSettings.salary > 0 ? String(userSettings.salary) : 'e.g., 50000'}
                min="0"
                step="1"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="pl-9"
                autoComplete="off"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to keep {userSettings.salary > 0 ? `₹${userSettings.salary.toLocaleString('en-IN')}` : 'no budget'}.
            </p>
          </div>

          {/* Type "reset" to confirm */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Type <span className="font-mono text-destructive">reset</span> to confirm
            </label>
            <Input
              placeholder="reset"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              className="font-mono"
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmed}
            className="w-full sm:w-auto"
          >
            Reset Month
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
