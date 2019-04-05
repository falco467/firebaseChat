/* global self */

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
    '/__/firebase/5.8.6/firebase-app.js',
    '/__/firebase/5.8.6/firebase-messaging.js',
    '/__/firebase/5.8.6/firebase-firestore.js',
    '/__/firebase/5.8.6/firebase-functions.js',
    '/__/firebase/5.8.6/firebase-auth.js',
    '/__/firebase/init.js'
  ]))
))

self.addEventListener('fetch', event => event.respondWith(
  self.caches.match(event.request).then(cacheHit => cacheHit || self.fetch(event.request))
))
