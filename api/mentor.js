// api/mentor.js
// Vercel Serverless Function - Conexão Resiliente com a API do Google Gemini

try { require('dotenv').config({ override: true }); } catch(e) {}

const handler = async (req, res) => {
    // Cabeçalhos CORS e JSON para permitir requisições seguras do frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;

        // Se a chave ainda não estiver configurada no .env
        if (!apiKey) {
            return res.status(400).json({
                error: 'CONFIG_REQUIRED',
                message: 'A variável de ambiente GEMINI_API_KEY não foi configurada no arquivo .env.'
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
   - Use '#### ' para identificar cada Bloco Prático de Estudo na ordem estrita de prioridade:
     * '#### Bloco 1: Limpeza e Aquecimento no Anki (Duração: ~30 min)'
     * '#### Bloco 2: Bateria Prática de Questões (Duração: ~40 min)'
     * '#### Bloco 3: Estudo do Cronograma - [Nome da Matéria Foco Atual] (Duração: ~50 min)'
   - Use tópicos com marcadores '-' curtos, e inicie cada tópico com o conceito em negrito (ex: '- **Alerta Vermelho nas Questões:** ...', '- **Objetivo:** ...', '- **Foco de Execução:** ...').
   - Use **negrito** nos dados críticos, números e métricas importantes.
   - NUNCA use blocos gigantescos de texto corrido. O estudante precisa bater o olho e identificar imediatamente o que deve fazer.

DIRETRIZES FUNDAMENTAIS DE ANÁLISE E PRIORIDADES:
1. ORDEM ESTRITA DE AÇÕES DO DIA: ANKI > QUESTÕES > ESTUDO DO CRONOGRAMA:
   - Toda rotina diária recomendada DEVE seguir RIGOROSAMENTE esta sequência de 3 blocos:
     * 1º Bloco: ANKI (Flashcards / Repetição Espaçada) -> Abrir SEMPRE o dia zerando as revisões pendentes. Proteger a retenção e a memória de longo prazo, impedindo a curva de esquecimento, além de servir como aquecimento neural imediato.
     * 2º Bloco: QUESTÕES (Bateria Prática / Treino Ativo) -> Após o Anki e ANTES da teoria do cronograma, resolver questões de concursos de TI. Treino ativo de recuperação (retrieval practice) e assimilação do perfil da banca examinadora.
     * 3º Bloco: ESTUDO DO CRONOGRAMA (Teoria / PDFs / Conteúdo da Semana) -> Somente após o Anki e as Questões, sentar para avançar na teoria e leitura de materiais da semana.

2. REGRA DO CRONOGRAMA SEMANAL E MONO-MATÉRIA (NUNCA FRAGMENTAR O DIA):
   - O cronograma do estudante é estritamente SEMANAL.
   - Se a semana atual tiver 2 ou mais matérias cadastradas:
     * É TERMINANTEMENTE PROIBIDO querer que o estudante veja uma matéria em uma fase do dia (ex: manhã) e outra matéria em outra fase (ex: tarde ou noite). Não faz sentido fragmentar o dia entre matérias distintas.
     * O estudante deve estudar e esgotar UMA ÚNICA MATÉRIA POR VEZ.
     * Você SEMPRE DEVE RECOMENDAR iniciar a segunda matéria da semana APENAS APÓS o check de conclusão da primeira matéria ter sido feito no cronograma.
     * Enquanto houver conteúdos pendentes da primeira matéria ('materiaFocoAtual'), 100% da carga do Bloco 3 (Estudo do Cronograma) deve ser dedicada a ela.
     * As matérias seguintes da semana ficam bloqueadas aguardando ('proximasMateriasAguardandoConclusao'). Deixe isso bem claro: alerte ao estudante que a próxima matéria só entrará em pauta após ele concluir e dar o check nos conteúdos da matéria atual no cronograma.

3. VISÃO ESTRATÉGICA DA SEMANA & ROADMAP DE TRANSIÇÃO (SENSO DE URGÊNCIA):
   - Embora o estudo ativo de hoje (Bloco 3) deva focar exclusivamente na matéria atual ('materiaFocoAtual'), você DEVE enriquecer suas respostas com LEMBRETES ESTRATÉGICOS sobre o horizonte da semana:
     * Reforce explicitamente quais conteúdos exatos ainda faltam para zerar a matéria atual (ex: "- **Alvo de Hoje:** Liquidar os conteúdos X e Y de Banco de Dados").
     * Lembre o estudante do dia da semana e do prazo: se a semana estiver avançando (quarta, quinta, sexta ou final de semana), reforce com firmeza que a semana já está se encaminhando para o fim e que o relógio está correndo.
     * Monte o plano de transição para os próximos dias: explique claramente a estratégia: "Nosso plano de hoje é liquidar [Matéria 1] para que amanhã e nos próximos dias você possa entrar com foco total em [Matéria 2] (e [Matéria 3]), fechando a semana com 100% do cronograma cumprido e sem carregar atrasos!".
     * Isso combina o rigor da mono-matéria diária com visão panorâmica, clareza de metas e senso de urgência.

4. DEMAIS DIRETRIZES DE ALTA PERFORMANCE:
   - Seja motivador, pragmático, analítico e focado em aprovação.
   - Use SEMPRE os dados reais do estudante fornecidos no snapshot de contexto.
   - Se o Anki tiver revisões atrasadas/pendentes hoje, alerte e coloque o Anki como prioridade no Bloco 1.
   - Inspecione 'analiseEspecialQuestoes': verifique dias sem fazer questões. Se estiver há 2 dias ou mais sem questões, emita alerta com firmeza.
   - Analise o campo 'tempoGeralDeEstudo' (7d e 30d): avalie o equilíbrio entre Conteúdo, Questões e Anki.
   - Se houver editais com data de prova próxima, aumente o peso das questões práticas.
   - Respeite o ritmo do estudante: se já estudou muitas horas hoje, parabenize pela consistência e sugira carga moderada para evitar burnout.
   - Quando perguntado "O que devo fazer hoje?", estruture a resposta nos 3 Blocos Práticos de Estudo na ordem ANKI > QUESTÕES > CRONOGRAMA.`;

        // Montagem do histórico para o formato do Gemini (memória real e contínua da mentoria)
        const formattedContents = [];

        if (Array.isArray(history)) {
            const cleanHistory = history.filter(item => 
                item && 
                typeof item.text === 'string' && 
                item.text.trim() && 
                !item.text.startsWith('❌') && 
                !item.text.startsWith('⚠️')
            ).slice(-8); // Mantém até 8 turnos de conversa para contexto real

            cleanHistory.forEach(item => {
                formattedContents.push({
                    role: (item.sender === 'user' || item.role === 'user') ? 'user' : 'model',
                    parts: [{ text: item.text }]
                });
            });
        }

        // Construção do prompt atual com a injeção do snapshot completo do estudante
        let currentPrompt = '';
        if (context) {
            currentPrompt += `[SNAPSHOT DE MÉTRICAS DO ESTUDANTE]:\n${JSON.stringify(context, null, 2)}\n\n`;
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
                maxOutputTokens: 2500 // Capacidade total de geração aprofundada sem cortes
            }
        };

        // Modelos em ordem de prioridade (Começando por 3.8-flash, com cascata resiliente contra spikes 503)
        const candidateModels = [
            'gemini-3.8-flash',
            'gemini-3.7-flash',
            'gemini-3.5-flash',
            'gemini-flash-latest'
        ];

        let lastError = null;
        let responseData = null;
        let usedEndpoint = null;

        // Chamada resiliente local
        for (const modelName of candidateModels) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-goog-api-key': apiKey
                    },
                    body: JSON.stringify(payload),
                    signal: AbortSignal.timeout(60000)
                });

                const data = await response.json();

                if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    responseData = data;
                    usedEndpoint = modelName;
                    break;
                }

                const errMsg = data.error?.message || '';
                if (response.status === 400 && errMsg.includes('API key not valid')) {
                    lastError = errMsg;
                    break;
                } else {
                    // Se for 503 (alta demanda temporária), 429 ou 404, continua imediatamente para o próximo modelo
                    lastError = errMsg || `Erro ${response.status} em ${modelName}`;
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

module.exports = handler;
