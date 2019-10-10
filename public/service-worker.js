/* global self */

// Unique String for reload: UidFix255

// For IntellisSense of Service-Worker classes in VS Code
/// <reference path="../dev/lib.webworker.d.ts"/>

// Caching for Offline Usage

self.addEventListener('install', event => event.waitUntil(
  self.caches.open('v1').then(cache => cache.addAll([
    '/',
    '/index.html',
    '/index.mjs',
    '/index.css',
    '/lib/vue.js',
    '/lib/pwacompat.js',
    '/lib/firebaseui.js',
    '/images/icons-192.png',
    '/images/icons-512.png',
    '/__/firebase/7.1.0/firebase-app.js',
    '/__/firebase/7.1.0/firebase-messaging.js',
    '/__/firebase/7.1.0/firebase-firestore.js',
    '/__/firebase/7.1.0/firebase-functions.js',
    '/__/firebase/7.1.0/firebase-auth.js',
    '/__/firebase/init.js'
  ]))
))

self.addEventListener('fetch', event => event.respondWith(
  self.caches.match(event.request).then(cacheHit => cacheHit || self.fetch(event.request))
))
