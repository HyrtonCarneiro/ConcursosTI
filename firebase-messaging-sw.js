importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Configuração unificada do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCXcmf8vYBZtBWhLP3k1HWDEUAC-_MSkwo",
    authDomain: "estudaqui-be0f5.firebaseapp.com",
    projectId: "estudaqui-be0f5",
    storageBucket: "estudaqui-be0f5.firebasestorage.app",
    messagingSenderId: "271897096717",
    appId: "1:271897096717:web:263533ff30f243c99ddb44",
    measurementId: "G-KJS46W8WP1"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// ---------------------------------------------------------
// 1. CACHE E OFFLINE (Unificado)
// ---------------------------------------------------------
const CACHE_NAME = 'concursosti-v4'; // Versão incrementada para forçar limpeza
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            clients.claim(),
            // Remove caches antigos
            caches.keys().then((keys) => {
                return Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null));
            })
        ])
    );
});

// ---------------------------------------------------------
// 2. FILTRO DE FETCH (Evita travar requisições de API)
// ---------------------------------------------------------
self.addEventListener('fetch', (event) => {
    // Não cachear requisições para a API ou Firebase
    if (event.request.url.includes('/api/') || event.request.url.includes('google') || event.request.url.includes('firebase') || event.request.method !== 'GET') {
        return;
    }
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                }
                return networkResponse;
            })
            .catch(() => caches.match(event.request))
    );
});

// ---------------------------------------------------------
// 3. PUSH NOTIFICATIONS
// ---------------------------------------------------------

// Background Message Handler
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Mensagem em background:', payload);
    const title = payload.data?.title || payload.notification?.title || 'ConcursosTI';
    const options = {
        body: payload.data?.body || payload.notification?.body || 'Você tem atualizações.',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'revisao-anki',
        renotify: true,
        data: { url: payload.data?.click_action || '/' }
    };
    return self.registration.showNotification(title, options);
});

// Ao clicar na notificação
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if ('focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow(urlToOpen);
        })
    );
});
