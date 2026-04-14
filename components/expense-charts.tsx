'use client'

import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Expense, type CategoryItem } from '@/lib/expense-types'
import { getExpenseCycleLabel, getExpenseCategories } from '@/lib/utils'

interface ExpenseChartsProps {
  expenses: Expense[]
  categories: CategoryItem[]
}

const COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
]

export function ExpenseCharts({ expenses, categories }: ExpenseChartsProps) {
  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {}
    categories.forEach((cat) => { totals[cat.name] = 0 })

    expenses.forEach((expense) => {
      const cats = getExpenseCategories(expense)
      const share = expense.amount / cats.length
      cats.forEach((cat) => {
        if (totals[cat] !== undefined) {
          totals[cat] += share
        }
      })
    })

    return categories.map((category, index) => ({
      name: category.name,
      value: Math.round((totals[category.name] ?? 0) * 100) / 100,
      fill: COLORS[index % COLORS.length],
    })).filter((item) => item.value > 0)
  }, [expenses, categories])

  const last7DaysData = useMemo(() => {
    const now = new Date()
    const days: { date: string; label: string; total: number }[] = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const label = date.toLocaleDateString('en-IN', { weekday: 'short' })
      days.push({ date: dateStr, label, total: 0 })
    }

    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date).toISOString().split('T')[0]
      const day = days.find((d) => d.date === expenseDate)
      if (day) {
        day.total += expense.amount
      }
    })

    return days
  }, [expenses])

  const monthlyData = useMemo(() => {
    const totals: Record<string, number> = {}

    expenses.forEach((expense) => {
      const label = getExpenseCycleLabel(expense)
      totals[label] = (totals[label] ?? 0) + expense.amount
    })

    // Sort by chronological order (newest last for bar chart reading)
    const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const sortedLabels = Object.keys(totals).sort((a, b) => {
      const parse = (s: string) => {
        const [month, year] = s.split(' ')
        return (parseInt(year) * 12) + MONTH_NAMES.indexOf(month)
      }
      return parse(a) - parse(b)
    })

    // Show last 12 cycles max
    const recentLabels = sortedLabels.slice(-12)
    return recentLabels.map((label) => ({
      month: label.split(' ')[0].slice(0, 3) + ' ' + label.split(' ')[1].slice(2),
      total: totals[label],
    }))
  }, [expenses])

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`
    }
    return `₹${value}`
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
          <p className="text-sm font-medium">
            ₹{payload[0].value.toLocaleString('en-IN')}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Category-wise Spending</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                No data to display
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-sm text-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Last 7 Days Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={last7DaysData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                  tickFormatter={formatCurrency}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-accent)' }} />
                <Bar
                  dataKey="total"
                  fill="var(--color-chart-1)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown Chart */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Monthly Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                tickFormatter={formatCurrency}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-accent)' }} />
              <Bar
                dataKey="total"
                fill="var(--color-chart-2)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
