window.notificationService = {
    // Diagnóstico silencioso ao iniciar
    autoRegister: async function() {
        try {
            if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
            
            const state = window.store.getState();
            if (!state.isAuthenticated || !state.currentUser) return;

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            const perm = Notification.permission;

            console.log(`[Push Status] Perm: ${perm}, Sub: ${!!subscription}, Token: ${!!state.fcmToken}`);

            // Se temos permissão mas não temos token ou assinatura, tentamos registrar silenciosamente
            if (perm === 'granted' && (!subscription || !state.fcmToken)) {
                await this._registerToken();
            }

            // Sempre configurar o handler de mensagens com a aba aberta
            this._setupForegroundHandler();
        } catch (e) {
            console.warn("Push autoRegister failed silently:", e);
        }
    },

    requestPermission: async function() {
        const state = window.store.getState();
        if (!state.isAuthenticated) {
            window.utils.showToast("Faça login primeiro.", "error");
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                window.utils.showToast("Iniciando registro seguro...", "info");
                await this._registerToken();
                window.utils.showToast("Notificações ATIVADAS com sucesso! 🎉", "success");
            } else {
                window.utils.showToast(`Permissão negada: ${permission}. Ative nas configurações do Chrome.`, "error");
            }
        } catch (error) {
            window.utils.showToast(`Falha no registro: ${error.message}`, "error");
        }
    },

    _registerToken: async function() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const VAPID_KEY = 'BHDkjfknKZxGgd6sRIQ7YemXZBzOjp9oyztTgGsho5DKH-PBQN_GUYQ6qy4ZiHU3XsNqx5kmSmxLSdIoHmLbB-s';
            
            const messaging = firebase.messaging();
            const token = await messaging.getToken({
                serviceWorkerRegistration: registration,
                vapidKey: VAPID_KEY
            });

            if (token) {
                window.store.getState().fcmToken = token;
                await window.store.save();
                this._updateStatusUI('active');
            } else {
                throw new Error("Token retornado pelo Google é nulo.");
            }
        } catch (e) {
            console.error("FCM Token Registration Error:", e);
            this._updateStatusUI('error');
            throw e;
        }
    },

    _setupForegroundHandler: function() {
        try {
            const messaging = firebase.messaging();
            messaging.onMessage((payload) => {
                console.log("Recebido (Foreground):", payload);
                const title = payload.data?.title || payload.notification?.title || 'ConcursosTI';
                const body = payload.data?.body || payload.notification?.body || '';
                
                // Mostrar toast visual
                window.utils.showToast(`🔔 ${title}: ${body}`, "success");
                
                // Tenta mostrar notificação nativa se possível
                if (Notification.permission === 'granted') {
                    new Notification(title, { body, icon: '/icon-192.png' });
                }
            });
        } catch (e) {}
    },

    _updateStatusUI: function(status) {
        const dot = document.getElementById('push-status-dot');
        const btn = document.getElementById('btn-enable-notifications');
        if (!dot) return;

        if (status === 'active') {
            dot.className = 'w-2 h-2 rounded-full bg-green-500 animate-pulse';
            if (btn) btn.innerHTML = '<i class="ph-bold ph-check-circle"></i> Notificações Ativas';
        } else if (status === 'error') {
            dot.className = 'w-2 h-2 rounded-full bg-red-500';
            if (btn) btn.innerHTML = '<i class="ph-bold ph-warning"></i> Erro no Registro';
        }
    },

    manualTestPush: async function() {
        const state = window.store.getState();
        if (!state.fcmToken) {
            window.utils.showToast("Ative as notificações antes de testar.", "error");
            return;
        }

        window.utils.showToast("Solicitando teste à API...", "info");
        
        try {
            const host = window.location.origin.includes('vercel') ? window.location.origin : 'https://concursosti.vercel.app';
            const res = await fetch(`${host}/api/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: state.fcmToken,
                    title: "Teste de Entrega! 🚀",
                    body: "Se você recebeu isso, sua configuração está perfeita."
                })
            });

            const data = await res.json();
            if (data.success) {
                window.utils.showToast("✅ API disparou com sucesso! Verifique o celular.", "success");
            } else {
                window.utils.showToast(`❌ Falha na API: ${data.error || 'Erro desconhecido'}`, "error");
                console.error("Link de diagnóstico:", `${host}/api/notify`);
            }
        } catch (e) {
            window.utils.showToast(`Conexão falhou: ${e.message}`, "error");
        }
    }
};
