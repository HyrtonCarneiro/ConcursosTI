// js/logic/mentorLogic.js
// Logic for student context assembly, prompt engineering, and markdown formatting

(function() {
    const mentorLogic = {
        /**
         * Formata o estado global da aplicação e métricas do Anki em um snapshot estruturado
         * para ser enviado como contexto para a IA.
         */
        buildStudentContext: function(state, ankiData) {
            state = state || {};
            const cronograma = Array.isArray(state.cronograma) ? state.cronograma : [];
            const materias = Array.isArray(state.materias) ? state.materias : [];
            const conteudos = Array.isArray(state.conteudos) ? state.conteudos : [];
            const pomodoroSessoes = Array.isArray(state.pomodoroSessoes) ? state.pomodoroSessoes : [];
            const editais = Array.isArray(state.editais) ? state.editais : [];
            const simulados = Array.isArray(state.simulados) ? state.simulados : [];
            const estatisticas = state.estatisticas || {};

            // Mapeamento de matérias e conteúdos
            const materiaMap = {};
            materias.forEach(m => { materiaMap[m.id] = m.nome; });
            const conteudoMap = {};
            conteudos.forEach(c => { conteudoMap[c.id] = c.nome; });

            // Métricas de Cronograma
            const totalItens = cronograma.length;
            const concluidos = cronograma.filter(item => item.concluido).length;
            const pendentes = totalItens - concluidos;
            const taxaConclusao = totalItens > 0 ? Math.round((concluidos / totalItens) * 100) : 0;

            // Semana atual aproximada (data formatada)
            const hoje = new Date();
            const hojeISO = hoje.toISOString().split('T')[0];

            // Itens pendentes por matéria
            const pendentesPorMateria = {};
            cronograma.filter(item => !item.concluido).forEach(item => {
                const nomeMateria = materiaMap[item.materiaId] || 'Não categorizada';
                pendentesPorMateria[nomeMateria] = (pendentesPorMateria[nomeMateria] || 0) + 1;
            });

            // Métricas de Pomodoro / Tempo de Estudo
            const umDiaAtras = new Date(hoje.getTime() - 24 * 60 * 60 * 1000);
            const seteDiasAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);

            let tempoFocoHojeMin = 0;
            let tempoFocoSemanaMin = 0;
            let sessoesHoje = 0;

            pomodoroSessoes.forEach(sessao => {
                const dataInicio = new Date(sessao.dataInicio || sessao.dataFim);
                const segFoco = Number(sessao.tempoTotalFocoSeg) || ((sessao.pomodorosConcluidos || 0) * (sessao.duracaoFoco || 25) * 60);
                const minFoco = Math.round(segFoco / 60);

                if (dataInicio >= umDiaAtras) {
                    tempoFocoHojeMin += minFoco;
                    sessoesHoje++;
                }
                if (dataInicio >= seteDiasAtras) {
                    tempoFocoSemanaMin += minFoco;
                }
            });

            // Editais Ativos e Dias até Provas
            const proximasProvas = editais.map(ed => {
                let diasRestantes = null;
                if (ed.dataProva) {
                    const diffTime = new Date(ed.dataProva) - hoje;
                    diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }
                return {
                    nome: ed.nome || 'Edital',
                    dataProva: ed.dataProva || 'Não informada',
                    diasRestantes: diasRestantes !== null ? diasRestantes : 'N/A'
                };
            }).filter(ed => ed.diasRestantes === 'N/A' || ed.diasRestantes >= 0);

            // Resumo do Anki
            const ankiResumo = ankiData ? {
                status: ankiData.success ? 'Conectado' : 'Offline/Pendente',
                origem: ankiData.source || 'indisponível',
                totalPendentesHoje: ankiData.count !== undefined ? ankiData.count : 0,
                cardsNovos: ankiData.breakdown?.new || 0,
                cardsAprendizado: ankiData.breakdown?.learn || 0,
                cardsRevisao: ankiData.breakdown?.review || 0
            } : {
                status: 'Não verificado',
                totalPendentesHoje: 0
            };

            return {
                estudante: {
                    usuario: state.currentUser || 'Estudante',
                    nomeExibicao: state.displayName || state.currentUser || 'Estudante',
                    streakDias: estatisticas.streak || 0,
                    dataAtual: hojeISO
                },
                cronograma: {
                    totalMetas: totalItens,
                    concluidas: concluidos,
                    pendentes: pendentes,
                    porcentagemGeral: taxaConclusao + '%',
                    distribuicaoPendencias: pendentesPorMateria
                },
                anki: ankiResumo,
                focoEPomodoro: {
                    minutosHoje: tempoFocoHojeMin,
                    horasHoje: (tempoFocoHojeMin / 60).toFixed(1) + 'h',
                    minutosUltimos7Dias: tempoFocoSemanaMin,
                    horasUltimos7Dias: (tempoFocoSemanaMin / 60).toFixed(1) + 'h',
                    sessoesConcluidasHoje: sessoesHoje
                },
                provasEEditais: proximasProvas,
                simuladosRecentes: simulados.slice(-3).map(s => ({
                    nome: s.nome,
                    nota: s.nota,
                    data: s.data
                }))
            };
        },

        /**
         * Gera o System Instruction especializado para o Mentor de Concursos TI.
         */
        buildSystemPrompt: function() {
            return `Você é o "Mentor Hyrtinho", um mentor e coach de elite para concursos de Tecnologia da Informação (TI).
Seu propósito é orientar o estudante com base estrita no progresso real dele, eliminando a paralisia por análise e gerando planos práticos, assertivos e de alto impacto.

REGRAS ESSENCIAIS:
1. Tom e Personalidade:
   - Direto, pragmático, motivador, analítico e focado em aprovação.
   - Linguagem em Português do Brasil, profissional e acolhedora.
   - Use emojis de forma moderada e estratégica para tornar a leitura escaneável.

2. Uso do Contexto:
   - Você receberá um objeto estruturado em JSON com as métricas do estudante (Cronograma, Anki, Horas de foco, Editais/Provas).
   - Analise os gargalos:
     * Se houver revisões no Anki acumuladas, lembre que revisões têm prioridade absoluta para não perder a retenção.
     * Se houver matérias de alto peso com muitas pendências, recomende foco nelas.
     * Se a prova estiver próxima (dias restantes baixos), priorize questões e revisão ativa sobre leitura passiva.
     * Considere o tempo já estudado hoje para não recomendar uma rotina humanamente impossível se ele já estiver cansado.

3. Formato das Respostas:
   - Responda sempre formatando em Markdown limpo (títulos com '###', tópicos com marcadores '-', negrito em pontos-chave).
   - Quando perguntado "o que fazer hoje", divida a sugestão em Blocos de Estudo práticos (ex: Bloco 1: Aquecimento & Anki; Bloco 2: Cronograma Foco; Bloco 3: Questões & Fixação).
   - Seja conciso e direto. Evite textos prolixos ou genéricos que qualquer chatbot daria sem olhar as métricas.`;
        },

        /**
         * Converte Markdown básico em HTML seguro para exibição no chat.
         */
        formatMarkdown: function(markdownText) {
            if (!markdownText) return '';

            // Escapar tags HTML perigosas primeiro
            let escaped = String(markdownText)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            // Blocos de código ```linguagem\n ... ```
            escaped = escaped.replace(/```([\s\S]*?)```/g, (match, p1) => {
                return `<pre class="bg-gray-900 text-gray-100 rounded-xl p-3 my-2 text-xs font-mono overflow-x-auto border border-gray-800"><code>${p1.trim()}</code></pre>`;
            });

            // Código inline `codigo`
            escaped = escaped.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-primary-700 px-1.5 py-0.5 rounded text-xs font-mono font-semibold">$1</code>');

            // Headers (h3, h4)
            escaped = escaped.replace(/^### (.*$)/gim, '<h4 class="text-sm font-black text-gray-900 uppercase tracking-wider mt-3 mb-1.5">$1</h4>');
            escaped = escaped.replace(/^## (.*$)/gim, '<h3 class="text-base font-black text-gray-900 tracking-tight mt-4 mb-2">$1</h3>');
            escaped = escaped.replace(/^# (.*$)/gim, '<h2 class="text-lg font-black text-gray-900 tracking-tight mt-4 mb-2">$1</h2>');

            // Negrito **texto**
            escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-black text-gray-900">$1</strong>');

            // Itálico *texto*
            escaped = escaped.replace(/\*([^*]+)\*/g, '<em class="italic text-gray-700">$1</em>');

            // Listas não ordenadas (- item ou * item)
            escaped = escaped.replace(/^[\*\-] (.*$)/gim, '<li class="ml-4 list-disc text-gray-700 my-0.5 text-xs leading-relaxed">$1</li>');

            // Listas numeradas (1. item)
            escaped = escaped.replace(/^\d+\.\s(.*$)/gim, '<li class="ml-4 list-decimal text-gray-700 my-0.5 text-xs leading-relaxed">$1</li>');

            // Quebras de linha normais
            escaped = escaped.replace(/\n\n/g, '<div class="my-2"></div>');
            escaped = escaped.replace(/\n/g, '<br>');

            return escaped;
        }
    };

    if (typeof window !== 'undefined') {
        window.mentorLogic = mentorLogic;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = mentorLogic;
    }
})();
