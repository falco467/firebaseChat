/* global self, firebase */

// For IntellisSense of Service-Worker classes in VS Code
/// <reference path="../dev/lib.webworker.d.ts"/>

self.importScripts(
  '/__/firebase/5.8.6/firebase-app.js',
  '/__/firebase/5.8.6/firebase-messaging.js',
  '/__/firebase/5.8.6/firebase-auth.js',
  '/__/firebase/init.js'
)

// Caching for Offline Usage

self.addEventListener('install', event => event.waitUntil(
  self.caches.open('v1').then(cache => cache.addAll([
    '/',
    '/index.html',
    '/index.mjs',
    '/index.css',
    '/vue.js',
    '/images/icons-192.png',
    '/images/icons-512.png'
  ]))
))

self.addEventListener('fetch', event => event.respondWith(
  self.caches.match(event.request).then(cacheHit => cacheHit || self.fetch(event.request))
))

// Notifications

firebase.messaging().setBackgroundMessageHandler(payload => {
  if (firebase.auth().getUid() === payload.data.authorId) return

  self.registration.showNotification(`${payload.data.authorName} wrote in ${payload.data.room}`, {
    body: payload.data.content,
    tag: payload.data.room,
    vibrate: [100, 50, 100],
    icon: '/images/icons-192.png'
  })
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(openWindows => {
    if (openWindows.length) return openWindows[0].focus()
    return self.clients.openWindow('/')
  }))
})
