'use client'

import dynamic from 'next/dynamic'

// Prevent SSR/prerender — Firebase SDK requires browser APIs
const ExpenseManager = dynamic(() => import('@/components/expense-manager'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  ),
})

export default function Page() {
  return <ExpenseManager />
}
