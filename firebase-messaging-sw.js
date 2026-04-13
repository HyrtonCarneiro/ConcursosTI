importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Configuração do Firebase para o Service Worker
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

// ============================================================
// CACHE (mesma lógica que o antigo sw.js, agora unificado aqui)
// ============================================================
const CACHE_NAME = 'concursos-ti-v2';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
];

// ============================================================
// SERVICE WORKER LIFECYCLE
// ============================================================
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Limpar caches antigos
    event.waitUntil(
        caches.keys().then((names) => {
            return Promise.all(
                names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
            );
        }).then(() => clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

// ============================================================
// PUSH NOTIFICATIONS (Background)
// ============================================================
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Push recebido em background:', payload);

    const title = payload.data?.title || payload.notification?.title || 'Estudaqui TI';
    const options = {
        body: payload.data?.body || payload.notification?.body || 'Nova atualização disponível',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'estudaqui-push',
        renotify: true,
        data: {
            url: payload.data?.click_action || 'https://concursosti.vercel.app'
        }
    };

    return self.registration.showNotification(title, options);
});

// Fallback: push event direto (caso o FCM não passe pelo onBackgroundMessage)
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch (e) {
        payload = { notification: { title: 'Estudaqui TI', body: event.data.text() } };
    }

    // Se o FCM já tratou via onBackgroundMessage, o 'notification' do payload
    // já terá sido exibido automaticamente. Este listener é apenas um fallback.
    const isFromFCM = payload.firebaseMessaging || payload.from;
    if (isFromFCM) return; // Já tratado pelo onBackgroundMessage

    const title = payload.notification?.title || payload.data?.title || 'Estudaqui TI';
    const options = {
        body: payload.notification?.body || payload.data?.body || '',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'estudaqui-push',
        renotify: true
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// Ao clicar na notificação
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data?.url || 'https://concursosti.vercel.app';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if ('focus' in client) return client.focus();
            }
            return clients.openWindow(urlToOpen);
        })
    );
});
