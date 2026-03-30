'use client'

// Updated to use correct Empty component exports
import { useState, useMemo } from 'react'
import { Plus, ArrowUpRight, ArrowDownLeft, Check, Clock, Trash2, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import type { Split } from '@/lib/expense-types'

interface SplitTrackerProps {
  splits: Split[]
  onAddSplit: (split: Split) => void
  onDeleteSplit: (id: string) => void
  onToggleSettled: (id: string) => void
}

export function SplitTracker({ splits, onAddSplit, onDeleteSplit, onToggleSettled }: SplitTrackerProps) {
  const [personName, setPersonName] = useState('')
  const [amount, setAmount] = useState('')
  const [splitType, setSplitType] = useState<'they_owe_me' | 'i_owe_them'>('they_owe_me')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!personName.trim() || !amount) return

    const split: Split = {
      id: crypto.randomUUID(),
      personName: personName.trim(),
      amount: parseFloat(amount),
      type: splitType,
      description: 'Manual entry',
      date: new Date().toISOString(),
      timestamp: Date.now(),
      settled: false,
    }

    onAddSplit(split)
    setPersonName('')
    setAmount('')
  }

  const { totalYouOwe, totalOwedToYou, peopleBreakdown } = useMemo(() => {
    let youOwe = 0
    let owedToYou = 0
    const people: Record<string, number> = {}

    splits.filter(s => !s.settled).forEach((split) => {
      if (split.type === 'i_owe_them') {
        youOwe += split.amount
        people[split.personName] = (people[split.personName] || 0) - split.amount
      } else {
        owedToYou += split.amount
        people[split.personName] = (people[split.personName] || 0) + split.amount
      }
    })

    return {
      totalYouOwe: youOwe,
      totalOwedToYou: owedToYou,
      peopleBreakdown: Object.entries(people).map(([name, balance]) => ({
        name,
        balance,
        owesYou: balance > 0,
      })).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)),
    }
  }, [splits])

  const sortedSplits = useMemo(() => {
    return [...splits].sort((a, b) => b.timestamp - a.timestamp)
  }, [splits])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="border-border/50 bg-gradient-to-br from-destructive/10 to-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-destructive/20 p-2">
                <ArrowUpRight className="size-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total You Owe</p>
                <p className="text-2xl font-bold text-destructive">
                  ₹{totalYouOwe.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/20 p-2">
                <ArrowDownLeft className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Owed to You</p>
                <p className="text-2xl font-bold text-primary">
                  ₹{totalOwedToYou.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* People Breakdown */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">People-wise Breakdown</CardTitle>
          <CardDescription>Net balance with each person</CardDescription>
        </CardHeader>
        <CardContent>
          {peopleBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending splits</p>
          ) : (
            <div className="space-y-3">
              {peopleBreakdown.map((person) => (
                <div
                  key={person.name}
                  className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-accent text-sm font-medium">
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{person.name}</span>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${person.owesYou ? 'text-primary' : 'text-destructive'}`}>
                      ₹{Math.abs(person.balance).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {person.owesYou ? 'owes you' : 'you owe'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Manual Entry */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Add Entry</CardTitle>
          <CardDescription>Manually log a split</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Person Name
              </label>
              <Input
                placeholder="e.g., Amit, Rahul..."
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
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
            <div className="w-full sm:w-44 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Type
              </label>
              <Select value={splitType} onValueChange={(val) => setSplitType(val as 'they_owe_me' | 'i_owe_them')}>
                <SelectTrigger className="w-full bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="they_owe_me">They owe me</SelectItem>
                  <SelectItem value="i_owe_them">I owe them</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full sm:w-auto">
              <Plus className="size-4" />
              Add Entry
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Transaction History</CardTitle>
          <CardDescription>All split records</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedSplits.length === 0 ? (
            <Empty className="py-8">
              <EmptyMedia variant="icon">
                <Users className="size-6" />
              </EmptyMedia>
              <EmptyTitle>No split records</EmptyTitle>
              <EmptyDescription>
                Add a travel expense with split or create a manual entry
              </EmptyDescription>
            </Empty>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                    <TableHead className="font-medium">Person</TableHead>
                    <TableHead className="font-medium">Description</TableHead>
                    <TableHead className="font-medium">Amount</TableHead>
                    <TableHead className="font-medium">Date</TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="w-20 font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSplits.map((split) => (
                    <TableRow key={split.id} className="hover:bg-secondary/20">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-medium">
                            {split.personName.charAt(0).toUpperCase()}
                          </div>
                          <span>{split.personName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-48 truncate text-muted-foreground">
                        {split.description}
                      </TableCell>
                      <TableCell>
                        <span className={split.type === 'they_owe_me' ? 'text-primary' : 'text-destructive'}>
                          {split.type === 'they_owe_me' ? '+' : '-'}₹{split.amount.toLocaleString('en-IN')}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(split.date)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={split.settled ? 'default' : 'secondary'}
                          className="gap-1"
                        >
                          {split.settled ? (
                            <>
                              <Check className="size-3" />
                              Settled
                            </>
                          ) : (
                            <>
                              <Clock className="size-3" />
                              Pending
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => onToggleSettled(split.id)}
                            title={split.settled ? 'Mark as pending' : 'Mark as settled'}
                          >
                            <Check className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => onDeleteSplit(split.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
