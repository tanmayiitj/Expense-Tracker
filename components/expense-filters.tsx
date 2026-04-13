'use client'

import { useMemo } from 'react'
import { Filter, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn, getExpenseCycleLabel } from '@/lib/utils'
import type { CategoryItem, Expense } from '@/lib/expense-types'

interface ExpenseFiltersProps {
  categoryFilter: string[]
  onCategoryChange: (categories: string[]) => void
  monthFilter: string | 'All'
  onMonthChange: (month: string | 'All') => void
  onClearFilters: () => void
  categories: CategoryItem[]
  expenses: Expense[]
}

export function ExpenseFilters({
  categoryFilter,
  onCategoryChange,
  monthFilter,
  onMonthChange,
  onClearFilters,
  categories,
  expenses,
}: ExpenseFiltersProps) {
  const hasFilters = categoryFilter.length > 0 || monthFilter !== 'All'

  // Derive cycle labels from actual expenses
  const cycleLabels = useMemo(() => {
    const labels = new Set<string>()
    expenses.forEach((e) => labels.add(getExpenseCycleLabel(e)))
    // Sort: newest first (based on parsing "Month YYYY")
    return Array.from(labels).sort((a, b) => {
      const parse = (s: string) => {
        const [month, year] = s.split(' ')
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
        return (parseInt(year) * 12) + months.indexOf(month)
      }
      return parse(b) - parse(a)
    })
  }, [expenses])

  const toggleCategory = (name: string) => {
    if (categoryFilter.includes(name)) {
      onCategoryChange(categoryFilter.filter((c) => c !== name))
    } else {
      onCategoryChange([...categoryFilter, name])
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="size-4" />
        <span>Filters</span>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-auto min-w-36 justify-start bg-secondary/50">
            {categoryFilter.length === 0 ? (
              <span className="text-muted-foreground">All Categories</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {categoryFilter.length <= 2 ? (
                  categoryFilter.map((c) => (
                    <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                  ))
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    {categoryFilter.length} selected
                  </Badge>
                )}
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search category..." />
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
                        categoryFilter.includes(cat.name) ? 'opacity-100' : 'opacity-0'
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

      <Select 
        value={monthFilter} 
        onValueChange={(val) => onMonthChange(val === 'All' ? 'All' : val)}
      >
        <SelectTrigger className="w-40 bg-secondary/50">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Months</SelectItem>
          {cycleLabels.map((label) => (
            <SelectItem key={label} value={label}>
              {label}
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
