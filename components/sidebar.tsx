'use client'

import { Wallet, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Section = 'expenses' | 'visuals' | 'settings'

interface SidebarProps {
  activeSection: Section
  onSectionChange: (section: Section) => void
}

const navItems = [
  {
    id: 'expenses' as Section,
    label: 'Expense Manager',
    icon: Wallet,
    description: 'Track daily spending',
  },
  {
    id: 'visuals' as Section,
    label: 'Visuals',
    icon: BarChart3,
    description: 'Charts & analytics',
  },
  {
    id: 'settings' as Section,
    label: 'Settings',
    icon: Settings,
    description: 'Categories & export',
  },
]

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-border px-6 py-5">
          <div className="rounded-lg bg-primary/10 p-2">
            <BarChart3 className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold tracking-tight">Smart Expense</h1>
            <p className="text-xs text-muted-foreground">Manager</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors',
                activeSection === item.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className="size-5" />
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs opacity-70">{item.description}</p>
              </div>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <p className="text-xs text-muted-foreground">
            Data stored locally in your browser
          </p>
        </div>
      </div>
    </aside>
  )
}

export function MobileNav({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card lg:hidden">
      <nav className="flex">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-3 transition-colors',
              activeSection === item.id
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            <item.icon className="size-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
