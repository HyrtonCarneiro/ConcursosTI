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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        initFirebase();
        const { username, key, newCount, learnCount, reviewCount } = req.body;

        if (!username || !key) {
            return res.status(400).json({ error: 'Username e Key são obrigatórios' });
        }

        // Buscar usuário pelo username (o ID do documento no Firestore é o username)
        const userRef = admin.firestore().collection('users').doc(username);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const userData = userDoc.data();

        // Validar monitorKey
        if (userData.ankiMonitorKey !== key) {
            return res.status(403).json({ error: 'Chave de monitor inválida' });
        }

        // Atualizar dados de sincronização
        const syncData = {
            counts: {
                new: parseInt(newCount) || 0,
                learn: parseInt(learnCount) || 0,
                review: parseInt(reviewCount) || 0
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await userRef.update({
            ankiSyncData: syncData
        });

        return res.status(200).json({ success: true, message: 'Dados sincronizados na nuvem' });
    } catch (error) {
        console.error('Erro no anki-sync:', error);
        return res.status(500).json({ error: error.message });
    }
};
