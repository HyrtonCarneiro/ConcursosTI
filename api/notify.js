const admin = require('firebase-admin');

// Inicializa o Firebase Admin garantindo que não dê erro em múltiplas execuções no ambiente Serverless
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            // Para produção real, Vercel injeta a credencial automaticamente 
            // se setarmos as variaveis de ambiente FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
            // Como este é um snippet inicial, usamos a default se disponivel
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Replace escapes pra nao quebrar chaves multilinhas da Vercel
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            })
        });
    } catch (e) {
        console.error("Erro ao inicializar admin SDK:", e);
    }
}

module.exports = async (req, res) => {
    // Configura os headers de CORS para permitir que o app de qualquer lugar (ex: file://) chame a API
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Responde ao preflight da requisição OPTIONS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { token, title, body } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'FCM Token ausente' });
        }

        const message = {
            notification: {
                title: title || 'Estudaqui TI',
                body: body || 'Nova mensagem de sistema'
            },
            token: token
        };

        const response = await admin.messaging().send(message);
        console.log('Mensagem enviada com sucesso:', response);
        
        return res.status(200).json({ success: true, messageId: response });
    } catch (error) {
        console.error('Erro ao enviar mensagem FCM:', error);
        return res.status(500).json({ error: "Erro interno: " + error.message });
    }
};
