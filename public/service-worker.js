/* global self workbox */

// For IntellisSense of Service-Worker classes in VS Code
/// <reference path="../dev/lib.webworker.d.ts"/>

self.importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js')

workbox.routing.registerRoute(
  /\.(?:css|js|mjs|html)$/,
  // Use cache but update in the background.
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'script-cache'
  })
)

workbox.routing.registerRoute(
  /^https:\/\/(?:fonts\.gstatic\.com|use\.fontawesome\.com)/,
  new workbox.strategies.CacheFirst({
    cacheName: 'font-cache',
    plugins: [
      new workbox.cacheableResponse.Plugin({
        statuses: [0, 200]
      }),
      new workbox.expiration.Plugin({
        // Cache fonts for a year
        maxAgeSeconds: 365 * 24 * 60 * 60 * 24,
        maxEntries: 30
      })
    ]
  })
)

workbox.routing.registerRoute(
  /\.(?:png|jpg|jpeg|svg|gif)$/,
  // Use the cache if it's available.
  new workbox.strategies.CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new workbox.expiration.Plugin({
        // Cache for a maximum of a week.
        maxAgeSeconds: 7 * 24 * 60 * 60,
        maxEntries: 20
      })
    ]
  })
)

workbox.routing.registerRoute(
  /^https:\/\/media.*\.giphy\.com\/.*\.gif$/,
  // Use the cache if it's available.
  new workbox.strategies.CacheFirst({
    cacheName: 'gif-cache',
    plugins: [
      new workbox.expiration.Plugin({
        // Cache for a maximum of a week.
        maxAgeSeconds: 7 * 24 * 60 * 60,
        maxEntries: 20
      })
    ]
  })
)

// Unique String for reload: X3
