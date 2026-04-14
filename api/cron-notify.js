const admin = require('firebase-admin');

function initFirebase() {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            })
        });
    }
}

module.exports = async (req, res) => {
    // Apenas Vercel Cron ou solicitações autorizadas podem chamar este endpoint
    // Se quiser adicionar uma chave de segurança:
    // if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) { ... }

    try {
        initFirebase();
        const db = admin.firestore();
        const now = new Date();
        
        // 1. Buscar todos os usuários que têm dados de sincronização do Anki
        const usersSnapshot = await db.collection('users')
            .where('ankiSyncData', '!=', null)
            .get();

        const results = [];

        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();
            const syncData = userData.ankiSyncData;
            const fcmToken = userData.fcmToken || (userData.state ? userData.state.fcmToken : null);

            if (!fcmToken || !syncData || !syncData.counts) continue;

            const totalPending = (syncData.counts.new || 0) + (syncData.counts.learn || 0) + (syncData.counts.review || 0);
            
            if (totalPending <= 0) continue;

            // 2. Verificar se já notificamos nas últimas 6 horas para evitar spam
            const lastNotified = userData.lastCloudNotificationAt ? userData.lastCloudNotificationAt.toDate() : new Date(0);
            const hoursSinceLastNotify = (now - lastNotified) / (1000 * 60 * 60);

            if (hoursSinceLastNotify >= 6) {
                // 3. Disparar Notificação
                const message = {
                    data: {
                        title: 'Estudos Pendentes 📚',
                        body: `Você tem ${totalPending} cards para revisar no Anki (Novos: ${syncData.counts.new} | Revisar: ${syncData.counts.review})`,
                        click_action: 'https://concursosti.vercel.app'
                    },
                    token: fcmToken
                };

                try {
                    await admin.messaging().send(message);
                    
                    // Atualizar timestamp da última notificação
                    await doc.ref.update({
                        lastCloudNotificationAt: admin.firestore.FieldValue.serverTimestamp()
                    });

                    results.push({ user: doc.id, status: 'Notified', total: totalPending });
                } catch (err) {
                    results.push({ user: doc.id, status: 'Error', error: err.message });
                }
            } else {
                results.push({ user: doc.id, status: 'Skipped (Too recent)', lastNotify: lastNotified });
            }
        }

        return res.status(200).json({ 
            success: true, 
            processed: usersSnapshot.size,
            results: results
        });

    } catch (error) {
        console.error('Erro no cron-notify:', error);
        return res.status(500).json({ error: error.message });
    }
};
