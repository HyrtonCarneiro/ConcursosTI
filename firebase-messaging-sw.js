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

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/images/icon-192x192.png' // A user pode criar depois se quiser, não quebra sem
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
