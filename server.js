// server.js
// Servidor Local Node.js / Express para ConcursosTI
require('dotenv').config();

// Fallback: se variáveis do Firebase não estiverem no .env, tenta carregar do .env.production
if (!process.env.FIREBASE_PROJECT_ID) {
    require('dotenv').config({ path: '.env.production' });
}

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares essenciais
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Headers CORS para suportar integrações locais
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-goog-api-key');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Rota de Healthcheck do Servidor Local
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        uptime: process.uptime(),
        geminiConfigured: !!process.env.GEMINI_API_KEY,
        firebaseConfigured: !!process.env.FIREBASE_PROJECT_ID,
        timestamp: Date.now()
    });
});

// Rotas da API (executam os mesmos handlers com 100% de performance local)
app.all('/api/mentor', async (req, res) => {
    try {
        const mentorHandler = require('./api/mentor.js');
        await mentorHandler(req, res);
    } catch (err) {
        console.error('Erro na rota /api/mentor:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
        }
    }
});

app.all('/api/anki-sync', async (req, res) => {
    try {
        const ankiSyncHandler = require('./api/anki-sync.js');
        await ankiSyncHandler(req, res);
    } catch (err) {
        console.error('Erro na rota /api/anki-sync:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
        }
    }
});

// Servir arquivos estáticos do frontend (HTML, JS, CSS, assets)
app.use(express.static(__dirname, {
    extensions: ['html', 'htm']
}));

// Fallback SPA (qualquer rota não estática redireciona para index.html)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Inicialização do servidor
app.listen(PORT, () => {
    const isGeminiReady = !!process.env.GEMINI_API_KEY;
    console.log('\n================================================================');
    console.log(`   🚀 ConcursosTI - Servidor Local 100% Ativo`);
    console.log('================================================================');
    console.log(`  ➜ Acesso:         http://localhost:${PORT}`);
    console.log(`  ➜ Mentor IA:      ${isGeminiReady ? '✅ Chave Gemini configurada' : '⚠️ GEMINI_API_KEY pendente no .env'}`);
    console.log(`  ➜ Limites Vercel: ❌ Eliminados (Sem timeout de 10s, sem caps)`);
    console.log(`  ➜ AnkiConnect:    Pronto para conexão direta em 127.0.0.1:8765`);
    console.log('================================================================\n');
});
