// api/mentor.js
// Vercel Serverless Function - Conexão Resiliente com a API do Google Gemini

module.exports = async (req, res) => {
    // Cabeçalhos CORS para permitir requisições seguras do frontend
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
        const apiKey = process.env.GEMINI_API_KEY;

        // Se a chave ainda não estiver configurada na Vercel
        if (!apiKey) {
            return res.status(400).json({
                error: 'CONFIG_REQUIRED',
                message: 'A variável de ambiente GEMINI_API_KEY não foi configurada na Vercel. Siga o guia para adicionar sua chave no painel da Vercel.'
            });
        }

        const { message, context, history } = req.body || {};

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Mensagem do usuário é obrigatória.' });
        }

        // Prompt do Sistema especializado
        const systemInstructionText = `Você é o "Mentor Hyrtinho", um mentor e coach de elite para concursos de Tecnologia da Informação (TI).
Seu objetivo é analisar as métricas e a rotina do estudante, orientar sobre prioridades, eliminar gargalos, incentivar constância e sugerir planos de ação claros, práticos e direto ao ponto para o dia de hoje ou para a semana.

DIRETRIZES DE FORMATAÇÃO E DESIGN DAS RESPOSTAS:
1. Formate suas respostas com visual IMPECÁVEL, legível e altamente estruturado:
   - Use SEMPRE '## ' para Títulos Principais / Headlines (ex: '## DIAGNÓSTICO DO DIA: FOCO TOTAL', '## PLANO DE AÇÃO PARA HOJE').
   - Use '---' para dividir seções (ex: entre o diagnóstico e o plano de ação).
   - Use '#### ' para identificar cada Bloco Prático de Estudo (ex: '#### Bloco 1: Aquecimento e Anki (Duração: ~30 min)', '#### Bloco 2: Teoria no Cronograma - Banco de Dados (Duração: ~50 min)', '#### Bloco 3: Questões e Fixação (Duração: ~40 min)').
   - Use tópicos com marcadores '-' curtos, e inicie cada tópico com o conceito em negrito (ex: '- **Alerta Vermelho nas Questões:** ...', '- **Objetivo:** ...', '- **Foco de Execução:** ...').
   - Use **negrito** nos dados críticos, números e métricas importantes.
   - NUNCA use blocos gigantescos de texto corrido. O estudante precisa bater o olho e identificar imediatamente o que deve fazer.

DIRETRIZES FUNDAMENTAIS DE ANÁLISE:
1. Seja motivador, pragmático, analítico e focado em alta performance para concursos.
2. Use SEMPRE os dados reais do estudante fornecidos no bloco de contexto:
   - Se o Anki tiver revisões atrasadas/pendentes hoje, alerte que a curva de esquecimento é traiçoeira e coloque o Anki no bloco inicial da rotina.
   - Se houver alerta na análise especial de questões (ex: dias sem resolver questões), dê destaque e coloque questões no plano de hoje.
   - Se o cronograma tiver matérias de TI com pendências acumuladas, oriente a atacá-las.
   - Se houver editais com data de prova próxima, enfatize resolução de questões e revisões ativas sobre leituras teóricas extensas.
   - Respeite o ritmo do estudante: se ele já estudou várias horas hoje, parabenize pela consistência e sugira carga moderada ou descanso para evitar burnout.
3. Quando perguntado "O que devo fazer hoje?", estruture a resposta nos 3 Blocos Práticos de Estudo.
4. Mantenha as respostas concisas, estratégicas e objetivas.`;

        // Montagem do histórico para o formato do Gemini
        const formattedContents = [];

        if (Array.isArray(history)) {
            const recentHistory = history.slice(-6);
            recentHistory.forEach(item => {
                if (item.text && item.text.trim()) {
                    formattedContents.push({
                        role: (item.sender === 'user' || item.role === 'user') ? 'user' : 'model',
                        parts: [{ text: item.text }]
                    });
                }
            });
        }

        // Construção do prompt atual com a injeção do snapshot do estudante
        let currentPrompt = '';
        if (context) {
            currentPrompt += `[SNAPSHOT DE MÉTRICAS DO ESTUDANTE ATUALIZADO EM TEMPO REAL]:\n${JSON.stringify(context, null, 2)}\n\n`;
        }
        currentPrompt += `PERGUNTA DO ESTUDANTE: "${message}"`;

        formattedContents.push({
            role: 'user',
            parts: [{ text: currentPrompt }]
        });

        const payload = {
            systemInstruction: {
                parts: [{ text: systemInstructionText }]
            },
            contents: formattedContents,
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048
            }
        };

        // Lista de endpoints candidatos (família Gemini 3.x - gemini-3.8-flash é a versão atual padrão)
        const preferredEndpoints = [
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent`,
            `https://generativelanguage.googleapis.com/v1/models/gemini-3.8-flash:generateContent`,
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent`,
            `https://generativelanguage.googleapis.com/v1/models/gemini-3.7-flash:generateContent`,
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro:generateContent`,
            `https://generativelanguage.googleapis.com/v1/models/gemini-3.1-pro:generateContent`
        ];

        let lastError = null;
        let responseData = null;
        let usedEndpoint = null;

        // Tentar os endpoints preferenciais
        for (const endpoint of preferredEndpoints) {
            try {
                const url = `${endpoint}?key=${apiKey}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-goog-api-key': apiKey
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    responseData = data;
                    usedEndpoint = endpoint;
                    break;
                }

                const errMsg = data.error?.message || '';
                // Se o modelo for 404 ou não estiver disponível para novos usuários, tenta o próximo
                if (response.status === 404 || errMsg.includes('not available') || errMsg.includes('not found')) {
                    lastError = errMsg || 'Model not available';
                    continue;
                } else if (response.status === 400 && errMsg.includes('API key not valid')) {
                    // Chave de API inválida
                    lastError = errMsg;
                    break;
                } else {
                    lastError = errMsg || 'API error';
                    continue;
                }
            } catch (err) {
                lastError = err.message;
            }
        }

        // Fallback dinâmico: Se nenhum dos preferenciais funcionou, consultar ListModels
        if (!responseData) {
            try {
                const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
                const listRes = await fetch(listUrl, {
                    headers: { 'x-goog-api-key': apiKey }
                });
                const listData = await listRes.json();

                if (listData.models && Array.isArray(listData.models)) {
                    // Filtrar modelos compatíveis e ordenar para priorizar versões 3.x modernas
                    const validModels = listData.models.filter(m => 
                        Array.isArray(m.supportedGenerationMethods) && 
                        m.supportedGenerationMethods.includes('generateContent') &&
                        m.name.includes('gemini')
                    ).sort((a, b) => {
                        const aScore = a.name.includes('3.8') ? 100 : (a.name.includes('3.7') ? 80 : (a.name.includes('3.') ? 50 : 1));
                        const bScore = b.name.includes('3.8') ? 100 : (b.name.includes('3.7') ? 80 : (b.name.includes('3.') ? 50 : 1));
                        return bScore - aScore;
                    });

                    for (const availableModel of validModels) {
                        try {
                            const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/${availableModel.name}:generateContent?key=${apiKey}`;
                            const fbResponse = await fetch(fallbackUrl, {
                                method: 'POST',
                                headers: { 
                                    'Content-Type': 'application/json',
                                    'x-goog-api-key': apiKey
                                },
                                body: JSON.stringify(payload)
                            });
                            const fbData = await fbResponse.json();
                            if (fbResponse.ok && fbData.candidates?.[0]?.content?.parts?.[0]?.text) {
                                responseData = fbData;
                                usedEndpoint = availableModel.name;
                                break;
                            } else {
                                lastError = fbData.error?.message || lastError;
                            }
                        } catch (e) {
                            lastError = e.message;
                        }
                    }
                }
            } catch (listErr) {
                console.warn('Erro ao consultar ListModels:', listErr);
            }
        }

        if (!responseData) {
            return res.status(500).json({
                error: 'GEMINI_API_ERROR',
                message: lastError || 'Não foi possível encontrar um modelo compatível com sua chave.'
            });
        }

        const reply = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

        return res.status(200).json({
            success: true,
            reply: reply,
            endpoint: usedEndpoint,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('Erro no handler api/mentor:', error);
        return res.status(500).json({
            error: 'INTERNAL_ERROR',
            message: error.message || 'Erro interno no servidor.'
        });
    }
};
