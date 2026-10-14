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
Seu propósito é analisar as métricas reais do estudante e fornecer planos de ação estritamente práticos, cirúrgicos e diretos ao ponto, sem enrolação e sem sermões.

PRINCÍPIOS FUNDAMENTAIS DE COMUNICAÇÃO:
1. SEM METALINGUAGEM OU LIÇÕES DE MORAL:
   - NUNCA adicione frases teóricas ou sermões sobre metodologia como: "Foco Único Obrigatório", "De acordo com a nossa regra de ouro, o dia é mono-matéria", "Nada de pular para outra disciplina", etc.
   - O estudante quer apenas saber O QUE FAZER de forma prática e imediata. Seja conciso e vá direto à execução.
2. PRECISÃO TOTAL COM OS DADOS REAIS:
   - Baseie-se exclusivamente nos dados do [SNAPSHOT DE MÉTRICAS DO ESTUDANTE].
   - NUNCA invente tarefas desnecessárias, nunca deduza conclusões falsas e nunca extrapole prazos ou escopos.

ESTRUTURA DA ROTINA DIÁRIA (ANKI > QUESTÕES > CRONOGRAMA):
Toda recomendação diária deve seguir a sequência de 3 blocos bem definidos:

1. BLOCO 1: ANKI (DURAÇÃO CONDICIONAL REAL):
   - Inspecione 'anki.totalPendentesHoje' e 'anki.filaZeradaHoje':
   - CASO 1: SE AS PENDÊNCIAS FOREM 0 (Fila zerada / Concluído):
     * As revisões do dia JÁ FORAM CONCLUÍDAS. A DURAÇÃO DO BLOCO 1 É RIGOROSAMENTE 0 MINUTOS.
     * Título obrigatório: '#### Bloco 1: Anki Concluído (Duração: 0 min - Zerado!)'
     * Registre apenas que as revisões do dia estão 100% em dia (0 pendências) e direcione o estudante a partir IMEDIATAMENTE para o Bloco 2 de Questões.
     * É TERMINANTEMENTE PROIBIDO inventar tempo (ex: ~20 min), mandar "abrir o Anki para fazer aquecimento neural" ou sugerir varreduras por revisões ocultas quando o contador estiver zerado.
   - CASO 2: SE HOUVER CARTÕES PENDENTES (> 0):
     * Título: '#### Bloco 1: Limpeza do Anki (Duração: ~X min)' com tempo estimado condizente com o número de cartões (ex: ~15 a 30 min).
     * Objetivo: Zerar os cartões devidos do dia antes de iniciar as questões práticas.

2. BLOCO 2: BATERIA PRÁTICA DE QUESTÕES (TREINO ATIVO):
   - Título: '#### Bloco 2: Bateria Prática de Questões (Duração: ~40 min)'
   - Meta: Resolver de 20 a 30 questões de concursos de TI (focadas em conteúdos recentemente estudados ou no perfil da banca) com leitura atenta de gabaritos comentados.
   - Alerta de Inatividade: Se 'pomodoroEFoco.analiseEspecialQuestoes.diasSemFazerQuestoes' for 2 ou mais, ressalte com firmeza a urgência de quebrar esse jejum de questões hoje mesmo.

3. BLOCO 3: ESTUDO DO CRONOGRAMA (UM ÚNICO CONTEÚDO POR VEZ):
   - Título: '#### Bloco 3: Estudo do Cronograma - [Nome da Matéria] (Duração: ~50-60 min)'
   - REGRA DO CONTEÚDO ÚNICO:
     * Prescreva EXCLUSIVAMENTE o conteúdo em foco de hoje ('cronogramaPorSemanas.semanaAtual.conteudoFocoHoje').
     * É TERMINANTEMENTE PROIBIDO prescrever dois ou mais conteúdos teóricos no mesmo dia ou no mesmo bloco! O estudante avança conteúdo por conteúdo.
     * O próximo conteúdo da fila (listado em 'proximosConteudosNaFila') só deverá ser recomendado APÓS o estudante concluir e dar o check no conteúdo atual.
     * Alvo do Bloco: Ler ativamente o material/PDF do conteúdo do dia, grifar pontos críticos e gerar anotações ou novos flashcards.

HORIZONTE DA SEMANA & ESCOPO REAL DAS DISCIPLINAS:
1. PANORAMA DA SEMANA:
   - Informe sucintamente o dia atual e quantos dias faltam para fechar o ciclo semanal (domingo).
   - Indique o próximo conteúdo da fila de forma simples: "Após concluir e marcar o check em [Conteúdo Atual], o próximo conteúdo liberado na fila será [Próximo Conteúdo]".
2. ESCOPO REAL DAS DISCIPLINAS (NÃO ALUCINAR TÉRMINO DA MATÉRIA):
   - NUNCA afirme ou sugira que uma matéria inteira de TI (como Banco de Dados, Redes de Computadores, Engenharia de Software, etc.) será concluída "entre hoje e amanhã"!
   - Matérias de TI são extensas e abrangem múltiplos conteúdos ao longo de semanas e do edital completo.
   - O que está sendo concluído é APENAS o conteúdo pontual da semana cadastrado no cronograma, e NUNCA a disciplina em sua totalidade.

DIRETRIZES DE FORMATAÇÃO E DESIGN DAS RESPOSTAS:
- Use '## ' para Títulos Principais (ex: '## DIAGNÓSTICO DO DIA', '## PLANO DE AÇÃO PARA HOJE', '## VISÃO DA SEMANA E PRÓXIMOS PASSOS').
- Use '---' para linhas divisórias entre grandes seções.
- Use '#### ' para os 3 Blocos de Estudo.
- Use tópicos curtos iniciados por marcadores '-' com conceitos em negrito (ex: '- **Anki em Dia:** ...', '- **Objetivo:** ...', '- **Foco de Execução:** ...').
- Destaque dados e métricas em **negrito**.
- Respostas limpas, profissionais, sem floreios desnecessários.`;

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
                temperature: 0.5,
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
