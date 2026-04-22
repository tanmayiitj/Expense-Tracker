'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    serwist?: {
      addEventListener: (event: string, callback: () => void) => void
      register: () => void
    }
  }
}

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.serwist !== undefined
    ) {
      window.serwist.addEventListener('installed', () => {
        // Optionally handle installed event
      })
      window.serwist.register()
    } else if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      // Fallback manual registration
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((err) => {
        console.warn('SW registration failed:', err)
      })
    }
  }, [])

  return null
}
