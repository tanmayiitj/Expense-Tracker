'use client'

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <svg
          className="size-8 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M12 12h.01"
          />
          <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">You are offline</h1>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Please check your internet connection. Your data will sync automatically once you are back online.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
      >
        Try Again
      </button>
    </div>
  )
}
