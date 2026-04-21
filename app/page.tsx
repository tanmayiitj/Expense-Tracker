'use client'

import dynamic from 'next/dynamic'

// Static shell skeleton — rendered in the server HTML so users see content instantly
// before any JS loads. This is the biggest perceived-performance win.
function AppShellSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <main className="lg:ml-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header skeleton */}
          <div className="mb-8 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-48 rounded bg-muted animate-pulse" />
              <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            </div>
          </div>
          {/* Summary cards skeleton */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
                <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                <div className="h-7 w-28 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
          {/* Table skeleton */}
          <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
                <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                <div className="h-4 w-16 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

// Firebase SDK requires browser APIs — can't run on server.
// But now we render a visible skeleton in the SSR HTML instead of a blank page.
const ExpenseManager = dynamic(() => import('@/components/expense-manager'), {
  ssr: false,
  loading: () => <AppShellSkeleton />,
})

export default function Page() {
  return <ExpenseManager />
}
