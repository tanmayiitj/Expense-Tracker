'use client'

import { Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CATEGORIES, type Category } from '@/lib/expense-types'

interface ExpenseFiltersProps {
  categoryFilter: Category | 'All'
  onCategoryChange: (category: Category | 'All') => void
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onClearFilters: () => void
}

export function ExpenseFilters({
  categoryFilter,
  onCategoryChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClearFilters,
}: ExpenseFiltersProps) {
  const hasFilters = categoryFilter !== 'All' || startDate || endDate

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="size-4" />
        <span>Filters</span>
      </div>
      
      <Select value={categoryFilter} onValueChange={(val) => onCategoryChange(val as Category | 'All')}>
        <SelectTrigger className="w-36 bg-secondary/50">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Categories</SelectItem>
          {CATEGORIES.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="w-36 bg-secondary/50"
          placeholder="Start Date"
        />
        <span className="text-muted-foreground">to</span>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="w-36 bg-secondary/50"
          placeholder="End Date"
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-muted-foreground">
          <X className="size-4" />
          Clear
        </Button>
      )}
    </div>
  )
}
