window.notificationService = {
    requestPermission: async function() {
        try {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                window.utils.showToast("Navegador sem suporte a Push.", "error");
                return;
            }

            const state = window.store.getState();
            if (!state.isAuthenticated || !state.currentUser) {
                window.utils.showToast("Faça login primeiro.", "error");
                return;
            }

            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                window.utils.showToast("Permissão negada: " + permission, "error");
                return;
            }

            window.utils.showToast("Testando conexão push (pode levar ~10s)...", "success");

            const registration = await navigator.serviceWorker.ready;
            console.log("Push: SW pronto:", registration.scope);

            const VAPID_KEY = 'BHDkjfknKZxGgd6sRIQ7YemXZBzOjp9oyztTgGsho5DKH-PBQN_GUYQ6qy4ZiHU3XsNqx5kmSmxLSdIoHmLbB-s';

            // === DIAGNÓSTICO: Testar PushManager diretamente (sem Firebase) ===
            try {
                console.log("Push: Teste direto do PushManager...");
                const existingSub = await registration.pushManager.getSubscription();
                if (existingSub) {
                    console.log("Push: Assinatura existente encontrada, removendo...");
                    await existingSub.unsubscribe();
                }

                // Converter VAPID key para Uint8Array
                const applicationServerKey = this._urlBase64ToUint8Array(VAPID_KEY);

                const testSub = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: applicationServerKey
                });
                console.log("Push: PushManager.subscribe SUCESSO!", testSub.endpoint);
                // Se chegou aqui, o PushManager funciona. Desfazer e deixar Firebase fazer.
                await testSub.unsubscribe();
            } catch (pushTestError) {
                console.error("Push: PushManager.subscribe FALHOU:", pushTestError.message);
                window.utils.showToast(
                    "O Chrome do seu celular não consegue se conectar ao serviço de push do Google. " +
                    "Isso é um problema do aparelho, não do site. Tente: " +
                    "1) Reiniciar o celular. " +
                    "2) Verificar se o Chrome está atualizado. " +
                    "3) Ir em Config do Chrome > Notificações e certificar que estão ativas. " +
                    "4) Limpar dados do Chrome: Configurações > Apps > Chrome > Limpar Cache.",
                    "error"
                );
                return;
            }

            // === Se o teste acima passou, Firebase vai funcionar ===
            const messaging = firebase.messaging();
            const token = await messaging.getToken({
                serviceWorkerRegistration: registration,
                vapidKey: VAPID_KEY
            });

            if (token) {
                // Salvar no estado da store (que cuida do merge no save)
                window.store.getState().fcmToken = token;
                await window.store.save();

                window.utils.showToast("Notificações ativadas com sucesso! 🎉", "success");
                const btn = document.getElementById('btn-enable-notifications');
                if (btn) btn.style.display = 'none';
            } else {
                window.utils.showToast("Token vazio. Firebase getToken retornou null.", "error");
            }

        } catch (error) {
            console.error("Push ERRO:", error);
            window.utils.showToast("ERRO: " + error.message, "error");
        }
    },

    _urlBase64ToUint8Array: function(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    },

    triggerMobilePush: async function(username, cardsCount, breakdown) {
        try {
            const userDoc = await window.db.collection('users').doc(username).get();
            if (!userDoc.exists) return false;
            const userData = userDoc.data();
            if (!userData.fcmToken) return false;

            const host = window.location.protocol === "file:"
                ? "https://concursosti.vercel.app"
                : window.location.origin;

            let bodyText = 'Você tem ' + cardsCount + ' cards pendentes no Anki para hoje!';
            if (breakdown) {
                bodyText += '\nNovos: ' + breakdown.new + ' | Aprender: ' + breakdown.learn + ' | Revisar: ' + breakdown.review;
            }

            const response = await fetch(host + '/api/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: userData.fcmToken,
                    title: "Estudos Pendentes 📚",
                    body: bodyText
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Erro no backend");
            }
            return true;
        } catch (error) {
            console.error("Push trigger erro:", error);
            return false;
        }
    }
};
