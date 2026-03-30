'use client'

import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CATEGORIES, MONTHS, type Category } from '@/lib/expense-types'

interface ExpenseFiltersProps {
  categoryFilter: Category | 'All'
  onCategoryChange: (category: Category | 'All') => void
  monthFilter: number | 'All'
  onMonthChange: (month: number | 'All') => void
  onClearFilters: () => void
}

export function ExpenseFilters({
  categoryFilter,
  onCategoryChange,
  monthFilter,
  onMonthChange,
  onClearFilters,
}: ExpenseFiltersProps) {
  const hasFilters = categoryFilter !== 'All' || monthFilter !== 'All'

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

      <Select 
        value={monthFilter === 'All' ? 'All' : String(monthFilter)} 
        onValueChange={(val) => onMonthChange(val === 'All' ? 'All' : parseInt(val))}
      >
        <SelectTrigger className="w-36 bg-secondary/50">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Months</SelectItem>
          {MONTHS.map((month, index) => (
            <SelectItem key={month} value={String(index)}>
              {month}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-muted-foreground">
          <X className="size-4" />
          Clear
        </Button>
      )}
    </div>
  )
}
