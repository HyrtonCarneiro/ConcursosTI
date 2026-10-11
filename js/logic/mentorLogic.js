// js/logic/mentorLogic.js
// Logic for student context assembly, prompt engineering, and markdown formatting

(function() {
    const mentorLogic = {
        /**
         * Formata o estado global da aplicação em um snapshot consistente estruturado
         * POR SEMANAS DE ESTUDO, MÉTRICAS FINAS DE POMODORO (especialmente QUESTÕES) e EDITAS REAIS.
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

            const hoje = new Date();
            const hojeISO = hoje.toISOString().split('T')[0];

            // Helper de segunda-feira da semana
            const getMonday = (dStr) => {
                if (!dStr) return hojeISO;
                const [y, m, d] = dStr.split('-').map(Number);
                const dt = new Date(y, m - 1, d);
                const day = dt.getDay();
                const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
                dt.setDate(diff);
                const yyyy = dt.getFullYear();
                const mm = String(dt.getMonth() + 1).padStart(2, '0');
                const dd = String(dt.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            };

            const semanaAtualMonday = getMonday(hojeISO);

            // 1. Agrupamento e Análise ESTRUTURADA POR SEMANAS
            const semanasMap = {};
            cronograma.forEach(item => {
                const sem = item.semana || 'Semana não definida';
                if (!semanasMap[sem]) {
                    semanasMap[sem] = {
                        semana: sem,
                        totalItens: 0,
                        concluidos: 0,
                        totalPaginas: 0,
                        paginasLidas: 0,
                        materias: {},
                        pendencias: []
                    };
                }
                semanasMap[sem].totalItens++;
                const pag = Number(item.paginas) || 0;
                semanasMap[sem].totalPaginas += pag;

                const nomeMat = materiaMap[item.materiaId] || 'Matéria Geral';
                const nomeCont = conteudoMap[item.conteudoId] || 'Conteúdo';

                if (item.concluido) {
                    semanasMap[sem].concluidos++;
                    semanasMap[sem].paginasLidas += pag;
                } else {
                    semanasMap[sem].materias[nomeMat] = (semanasMap[sem].materias[nomeMat] || 0) + 1;
                    semanasMap[sem].pendencias.push({
                        materia: nomeMat,
                        conteudo: nomeCont,
                        paginas: pag
                    });
                }
            });

            const todasSemanas = Object.keys(semanasMap).sort();
            const totalSemanas = todasSemanas.length;
            let semanasConcluidas = 0;
            const semanasAtrasadas = [];
            let semanaAtualDetalhe = null;
            let totalConteudosGeral = 0;
            let conteudosConcluidosGeral = 0;

            todasSemanas.forEach(sem => {
                const dados = semanasMap[sem];
                totalConteudosGeral += dados.totalItens;
                conteudosConcluidosGeral += dados.concluidos;

                const is100Perc = dados.totalItens > 0 && dados.concluidos === dados.totalItens;
                if (is100Perc) {
                    semanasConcluidas++;
                }

                // Identifica semanas anteriores com atraso
                if (sem < semanaAtualMonday && !is100Perc) {
                    semanasAtrasadas.push({
                        semana: sem,
                        itensPendentes: dados.totalItens - dados.concluidos,
                        materiasAtrasadas: dados.materias
                    });
                }

                // Identifica a semana atual
                if (sem === semanaAtualMonday) {
                    semanaAtualDetalhe = {
                        semana: sem,
                        totalItensSemana: dados.totalItens,
                        concluidosSemana: dados.concluidos,
                        pendentesSemana: dados.totalItens - dados.concluidos,
                        porcentagemSemana: dados.totalItens > 0 ? Math.round((dados.concluidos / dados.totalItens) * 100) + '%' : '0%',
                        itensParaEstudarHojeOuNestaSemana: dados.pendencias
                    };
                }
            });

            // Se a semana do calendário atual não estiver registrada no cronograma, usa a próxima ativa não concluída
            if (!semanaAtualDetalhe && todasSemanas.length > 0) {
                const primeiraNaoConcluida = todasSemanas.find(s => semanasMap[s].concluidos < semanasMap[s].totalItens) || todasSemanas[0];
                const dados = semanasMap[primeiraNaoConcluida];
                semanaAtualDetalhe = {
                    semana: primeiraNaoConcluida,
                    observacao: "Próxima Semana de Estudos em Aberto",
                    totalItensSemana: dados.totalItens,
                    concluidosSemana: dados.concluidos,
                    pendentesSemana: dados.totalItens - dados.concluidos,
                    porcentagemSemana: dados.totalItens > 0 ? Math.round((dados.concluidos / dados.totalItens) * 100) + '%' : '0%',
                    itensParaEstudarHojeOuNestaSemana: dados.pendencias
                };
            }

            const percSemanasConcluidas = totalSemanas > 0 ? Math.round((semanasConcluidas / totalSemanas) * 100) : 0;

            // 2. Métricas Avançadas de Pomodoro e Análise de Questões/Categorias
            const umDiaAtras = new Date(hoje.getTime() - 24 * 60 * 60 * 1000);
            const seteDiasAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);

            let tempoFocoHojeMin = 0;
            let tempoFocoSemanaMin = 0;
            let sessoesHoje = 0;
            const tempoPorCategoriaMin = {};
            const sessoesQuestoes = [];

            // Ordenar sessões por data (mais recente primeiro)
            const sessoesOrdenadas = [...pomodoroSessoes].sort((a, b) => {
                const dateA = new Date(a.dataFim || a.dataInicio || 0);
                const dateB = new Date(b.dataFim || b.dataInicio || 0);
                return dateB - dateA;
            });

            sessoesOrdenadas.forEach(sessao => {
                const dataObj = new Date(sessao.dataFim || sessao.dataInicio || 0);
                const segFoco = Number(sessao.tempoTotalFocoSeg) || ((sessao.pomodorosConcluidos || 0) * (sessao.duracaoFoco || 25) * 60);
                const minFoco = Math.round(segFoco / 60);

                const catNome = (sessao.categoria || 'Livre').trim();
                const matNome = (sessao.materia || (Array.isArray(sessao.materias) ? sessao.materias.join(', ') : 'Geral') || 'Geral').trim();

                if (dataObj >= umDiaAtras) {
                    tempoFocoHojeMin += minFoco;
                    sessoesHoje++;
                }
                if (dataObj >= seteDiasAtras) {
                    tempoFocoSemanaMin += minFoco;
                    tempoPorCategoriaMin[catNome] = (tempoPorCategoriaMin[catNome] || 0) + minFoco;
                }

                // Identifica se a sessão pertence à categoria de Questões
                const isQuestoes = catNome.toLowerCase().includes('quest') || (sessao.nota && sessao.nota.toLowerCase().includes('quest'));
                if (isQuestoes) {
                    sessoesQuestoes.push({
                        data: dataObj.toISOString().split('T')[0],
                        dataCompleta: dataObj,
                        materia: matNome,
                        duracaoMinutos: minFoco,
                        pomodoros: sessao.pomodorosConcluidos || 1,
                        anotacao: sessao.nota ? sessao.nota.trim() : null,
                        semana: sessao.semana || null
                    });
                }
            });

            // Distribuição de tempo por categoria na última semana
            const distribuicaoCategoriasSemana = {};
            Object.keys(tempoPorCategoriaMin).forEach(cat => {
                distribuicaoCategoriasSemana[cat] = (tempoPorCategoriaMin[cat] / 60).toFixed(1) + 'h';
            });

            // Diagnóstico específico e aprofundado de QUESTÕES
            let diagnosticoQuestoes = null;
            if (sessoesQuestoes.length > 0) {
                const ultima = sessoesQuestoes[0];
                const diffDias = Math.floor((hoje - ultima.dataCompleta) / (1000 * 60 * 60 * 24));
                const quandoTexto = diffDias === 0 ? "Hoje" : (diffDias === 1 ? "Ontem (há 1 dia)" : `Há ${diffDias} dias atrás`);

                const minQuestoesSemana = sessoesQuestoes
                    .filter(s => s.dataCompleta >= seteDiasAtras)
                    .reduce((sum, s) => sum + s.duracaoMinutos, 0);

                diagnosticoQuestoes = {
                    dataUltimaSessao: ultima.data,
                    quandoFoiUltimaVez: quandoTexto,
                    diasSemFazerQuestoes: diffDias,
                    materiaEstudadaNaUltimaSessao: ultima.materia,
                    tempoUltimaSessao: (ultima.duracaoMinutos / 60).toFixed(1) + 'h (' + ultima.duracaoMinutos + ' min)',
                    anotacoesRegistradasNaSessao: ultima.anotacao || "Nenhuma anotação registrada",
                    tempoTotalQuestoesUltimos7Dias: (minQuestoesSemana / 60).toFixed(1) + 'h',
                    alertaStatus: diffDias >= 2 
                        ? `⚠️ ALERTA: Você está há ${diffDias} dias sem resolver questões!`
                        : "✅ Prática de questões em dia"
                };
            } else {
                diagnosticoQuestoes = {
                    status: "Nenhuma sessão na categoria 'Questões' registrada até o momento.",
                    alertaStatus: "⚠️ CRÍTICO: Nenhuma sessão de questões foi registrada ainda no Pomodoro. Resolver questões é indispensável para aprovação!"
                };
            }

            // Últimas 3 sessões recentes de qualquer categoria
            const ultimasSessoesRecentes = sessoesOrdenadas.slice(0, 3).map(s => {
                const dataObj = new Date(s.dataFim || s.dataInicio || 0);
                const seg = Number(s.tempoTotalFocoSeg) || ((s.pomodorosConcluidos || 0) * (s.duracaoFoco || 25) * 60);
                return {
                    data: dataObj.toISOString().split('T')[0],
                    categoria: s.categoria || 'Livre',
                    materia: s.materia || 'Geral',
                    duracao: Math.round(seg / 60) + ' min',
                    anotacao: s.nota ? s.nota.trim() : null
                };
            });

            // 3. Editais Ativos e Status Real das Provas
            const editaisResumo = editais.filter(ed => !ed.ignorado).map(ed => {
                let diasRestantes = null;
                let statusProva = "Data da prova ainda não definida pelo órgão";

                if (ed.dataProva && ed.dataProva.trim() && ed.dataProva !== 'dd/mm/aaaa') {
                    const dataProvaObj = new Date(ed.dataProva + 'T00:00:00');
                    if (!isNaN(dataProvaObj.getTime())) {
                        const diffTime = dataProvaObj - hoje;
                        diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        statusProva = diasRestantes >= 0 ? `${diasRestantes} dias restantes` : "Prova já realizada";
                    }
                }

                return {
                    concurso: ed.nome || 'Concurso',
                    statusEdital: ed.status || 'Previsto / Autorizado',
                    dataProva: ed.dataProva || 'Ainda não definida',
                    statusProva: statusProva,
                    diasRestantes: diasRestantes
                };
            });

            // 4. Resumo do Anki
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

            // 5. Simulados reais
            const simuladosResumo = simulados.length > 0 
                ? simulados.slice(-3).map(s => ({ nome: s.nome, nota: s.nota, data: s.data }))
                : "Nenhum simulado cadastrado ou realizado até o momento.";

            return {
                estudante: {
                    usuario: state.currentUser || 'Estudante',
                    nomeExibicao: state.displayName || state.currentUser || 'Estudante',
                    streakDias: estatisticas.streak || 0,
                    dataAtual: hojeISO
                },
                cronogramaPorSemanas: {
                    totalSemanasPlanejadas: totalSemanas,
                    semanasCompletadas100Porcento: semanasConcluidas,
                    taxaConclusaoSemanas: percSemanasConcluidas + '%',
                    semanaAtual: semanaAtualDetalhe,
                    semanasAnterioresComAtrasos: semanasAtrasadas,
                    totaisGerais: {
                        totalConteudos: totalConteudosGeral,
                        conteudosConcluidos: conteudosConcluidosGeral
                    }
                },
                anki: ankiResumo,
                pomodoroEFoco: {
                    horasHoje: (tempoFocoHojeMin / 60).toFixed(1) + 'h',
                    horasUltimos7Dias: (tempoFocoSemanaMin / 60).toFixed(1) + 'h',
                    sessoesHoje: sessoesHoje,
                    distribuicaoPorCategoriaUltimos7Dias: distribuicaoCategoriasSemana,
                    analiseEspecialQuestoes: diagnosticoQuestoes,
                    ultimasSessoesRecentes: ultimasSessoesRecentes
                },
                editaisCadastrados: editaisResumo,
                simulados: simuladosResumo
            };
        },

        /**
         * Gera o System Instruction especializado para o Mentor de Concursos TI.
         */
        buildSystemPrompt: function() {
            return `Você é o "Mentor Hyrtinho", um mentor e coach de elite para concursos de Tecnologia da Informação (TI).
Seu propósito é orientar o estudante com base estrita no progresso real dele, eliminando a paralisia por análise e gerando planos práticos, assertivos e de alto impacto.

REGRAS DE ANÁLISE DE MÉTRICAS:
1. Cronograma por Semanas:
   - O cronograma do estudante é organizado estritamente por SEMANAS DE ESTUDO.
   - Analise primeiro a "Semana Atual": veja quais são os conteúdos planejados para ela e quais ainda estão pendentes.
   - Se houver "Semanas Anteriores com Atrasos", ALERTE o estudante e oriente como quitar o backlog sem comprometer a semana atual.
   - Nunca confunda quantidade de conteúdos com quantidade de semanas.

2. Prática de QUESTÕES (Prioridade Máxima em Concursos):
   - Inspecione sempre o campo 'analiseEspecialQuestoes' no bloco de Pomodoro:
     * Verifique quando foi a última vez que ele fez questões ('quandoFoiUltimaVez' e 'diasSemFazerQuestoes').
     * Se ele estiver há 2 dias ou mais sem resolver questões (ou nunca tiver feito), ALERTE-O com firmeza e inclua um bloco obrigatório de questões na matéria prioritária de hoje.
     * Se ele registrou anotações na última sessão de questões ('anotacoesRegistradasNaSessao', como banca, erros ou taxa de acerto), use essa informação para parabenizá-lo ou calibrar a estratégia.
     * Observe qual foi a matéria estudada na última sessão de questões ('materiaEstudadaNaUltimaSessao') para não repetir desnecessariamente caso outra disciplina esteja negligenciada.

3. Flashcards (Anki):
   - Se houver revisões pendentes no Anki, elas sempre abrem o primeiro bloco do dia para proteger a memória de longo prazo.

4. Editais e Provas:
   - Nunca invente datas de provas. Se constar como "Data da prova ainda não definida pelo órgão", oriente o estudante considerando que é um concurso pré-edital/autorizado, onde a base teórica e a consolidação no Anki são o foco principal.

5. Formato das Respostas:
   - Responda sempre formatando em Markdown limpo (títulos com '###', tópicos com marcadores '-', negrito em pontos-chave).
   - Quando perguntado "o que fazer hoje", divida a rotina em Blocos de Estudo práticos (Bloco 1: Aquecimento/Anki; Bloco 2: Cronograma Foco; Bloco 3: Questões & Fixação).
   - Seja conciso, motivador e estratégico.`;
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
