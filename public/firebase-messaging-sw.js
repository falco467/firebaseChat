/* global self, firebase */

// For IntellisSense of Service-Worker classes in VS Code
/// <reference path="../dev/lib.webworker.d.ts"/>

self.importScripts(
  '/__/firebase/7.1.0/firebase-app.js',
  '/__/firebase/7.1.0/firebase-messaging.js',
  '/__/firebase/7.1.0/firebase-auth.js',
  '/__/firebase/init.js'
)

// Notifications
let uid = firebase.auth().getUid()

self.addEventListener('message', event => {
  if (event.data.type === 'uid') {
    uid = event.data.uid
  }
})

firebase.messaging().setBackgroundMessageHandler(payload => {
  if (uid === payload.data.authorId) return

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
