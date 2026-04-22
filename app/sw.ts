import { defaultCache } from '@serwist/next/worker'
import { CacheFirst, ExpirationPlugin, NetworkOnly, Serwist } from 'serwist'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  disableDevLogs: true,
  fallbacks: {
    entries: [
      {
        url: '/~offline',
        matcher({ request }) {
          return request.destination === 'document'
        },
      },
    ],
  },
  runtimeCaching: [
    // Firebase Auth — always go to network
    {
      matcher: /^https:\/\/(?:identitytoolkit|securetoken)\.googleapis\.com\/.*/i,
      handler: new NetworkOnly(),
    },
    // Firestore — always go to network (Firestore handles its own offline cache)
    {
      matcher: /^https:\/\/.*firestore\.googleapis\.com\/.*/i,
      handler: new NetworkOnly(),
    },
    // Google Fonts — cache-first
    {
      matcher: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: new CacheFirst({
        cacheName: 'google-fonts',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          }),
        ],
      }),
    },
    ...defaultCache,
  ],
})

serwist.addEventListeners()
