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
                window.utils.showToast("Permissão negada pelo navegador: '" + permission + "'. Vá em Configurações do Chrome > Notificações e permita este site.", "error");
                return;
            }

            window.utils.showToast("Registrando push (pode levar ~10s)...", "success");

            // Aguardar o Service Worker ficar pronto
            const registration = await navigator.serviceWorker.ready;
            console.log("Push: SW pronto. Scope:", registration.scope, "Active:", registration.active?.scriptURL);

            // Verificar se o SW correto está ativo (deve ser firebase-messaging-sw.js)
            if (registration.active && !registration.active.scriptURL.includes('firebase-messaging')) {
                console.warn("Push: SW ativo NÃO é o firebase-messaging-sw.js! É:", registration.active.scriptURL);
                window.utils.showToast("ERRO: Service Worker errado ativo (" + registration.active.scriptURL + "). Limpe o cache do navegador e recarregue.", "error");
                return;
            }

            const VAPID_KEY = 'BHDkjfknKZxGgd6sRIQ7YemXZBzOjp9oyztTgGsho5DKH-PBQN_GUYQ6qy4ZiHU3XsNqx5kmSmxLSdIoHmLbB-s';

            const messaging = firebase.messaging();
            const token = await messaging.getToken({
                serviceWorkerRegistration: registration,
                vapidKey: VAPID_KEY
            });

            if (token) {
                console.log("Push: Token obtido com sucesso. Prefix:", token.substring(0, 20) + "...");

                // Salvar no estado da store (que cuida do merge no save)
                window.store.getState().fcmToken = token;
                await window.store.save();

                window.utils.showToast("Notificações ativadas com sucesso! 🎉 Token salvo.", "success");
                const btn = document.getElementById('btn-enable-notifications');
                if (btn) btn.textContent = '✅ Notificações Ativas';

                // Registrar handler de foreground para mostrar notificações enquanto o app está aberto
                this._setupForegroundHandler(messaging);
            } else {
                window.utils.showToast("ERRO CRÍTICO: Firebase getToken() retornou null. Isso pode significar que a VAPID Key está errada ou o PushManager não consegue se conectar ao Google.", "error");
            }

        } catch (error) {
            console.error("Push ERRO completo:", error);
            window.utils.showToast("ERRO no registro: " + error.message, "error");
        }
    },

    _setupForegroundHandler: function(messaging) {
        try {
            messaging.onMessage((payload) => {
                console.log("Push: Mensagem recebida em FOREGROUND:", payload);

                const title = payload.data?.title || payload.notification?.title || 'Estudaqui TI';
                const body = payload.data?.body || payload.notification?.body || '';

                // Usar a Notification API diretamente (funciona quando o app está aberto)
                if (Notification.permission === 'granted') {
                    new Notification(title, {
                        body: body,
                        icon: '/icon-192.png',
                        tag: 'estudaqui-foreground',
                        renotify: true
                    });
                }

                // Também mostrar um toast no app
                window.utils.showToast("🔔 " + title + ": " + body, "success");
            });
            console.log("Push: Handler de foreground registrado.");
        } catch (e) {
            console.warn("Push: Não foi possível registrar onMessage:", e.message);
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
    },

    manualTestPush: async function() {
        try {
            const state = window.store.getState();
            const token = state.fcmToken;

            if (!token) {
                window.utils.showToast("ERRO: Nenhum token FCM salvo. Clique em 'Ativar Notificações' primeiro.", "error");
                return;
            }

            // Diagnóstico: mostrar informações sobre o estado do push
            const swReg = await navigator.serviceWorker.getRegistration();
            const swInfo = swReg ? swReg.active?.scriptURL || 'nenhum ativo' : 'não registrado';
            const permStatus = Notification.permission;

            console.log("Push Teste - Token prefix:", token.substring(0, 20));
            console.log("Push Teste - SW:", swInfo);
            console.log("Push Teste - Permissão:", permStatus);

            if (permStatus !== 'granted') {
                window.utils.showToast("ERRO: Permissão de notificação é '" + permStatus + "'. Vá em Configurações > Notificações e permita este site.", "error");
                return;
            }

            window.utils.showToast("Enviando teste... (Token: " + token.substring(0, 15) + "...)", "info");

            const host = window.location.protocol === "file:"
                ? "https://concursosti.vercel.app"
                : window.location.origin;

            const response = await fetch(host + '/api/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: token,
                    title: "Teste de Fogo! 🔥",
                    body: "Se você recebeu isso, seu celular está configurado corretamente."
                })
            });

            const resData = await response.json();

            if (resData.success) {
                window.utils.showToast(
                    "✅ Firebase aceitou! MessageId: " + (resData.messageId || '?').substring(0, 30) +
                    ". Se NÃO aparecer a notificação: 1) Verifique Configurações > Apps > Chrome > Notificações. " +
                    "2) Desative Economia de Bateria para o Chrome. " +
                    "3) SW ativo: " + swInfo,
                    "success"
                );
            } else {
                window.utils.showToast(
                    "❌ Firebase REJEITOU: " + (resData.error || "Erro desconhecido") +
                    " (código: " + (resData.code || '?') + "). " +
                    "Se 'unregistered': clique 'Ativar Notificações' novamente.",
                    "error"
                );
            }
        } catch (error) {
            console.error("Erro no teste de push:", error);
            window.utils.showToast("Erro de conexão: " + error.message, "error");
        }
    }
};
