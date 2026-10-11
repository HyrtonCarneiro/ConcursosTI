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

            // 6. Métricas Consolidadas de Tempo de Estudo por Modalidade (Anki, Conteúdo e Questões)
            let ankiMap = {};
            if (ankiData && Array.isArray(ankiData.dailyTimeList)) {
                ankiData.dailyTimeList.forEach(d => { ankiMap[d.dateKey] = d.timeMs; });
            } else if (typeof localStorage !== 'undefined') {
                try {
                    const cached = localStorage.getItem('anki_study_time_history_cache');
                    if (cached) ankiMap = JSON.parse(cached).data || {};
                } catch(e) {}
            }

            const met7d = this.calculateStudyMetrics(state, ankiMap, 7);
            const met30d = this.calculateStudyMetrics(state, ankiMap, 30);

            let diagEquilibrio = "Equilíbrio em avaliação.";
            if (met7d.totalGeralMin === 0) {
                diagEquilibrio = "Nenhuma sessão registrada nos últimos 7 dias.";
            } else if (met7d.totalQuestoesMin === 0) {
                diagEquilibrio = "⚠️ CRÍTICO: Zero minutos de resolução de questões nos últimos 7 dias. Prioridade máxima inserir baterias práticas!";
            } else if (met7d.percQuestoes < 25) {
                diagEquilibrio = `⚠️ ALERTA: Apenas ${met7d.percQuestoes}% do tempo recente foi em questões. O ideal para aprovação é elevar para 40%-50%.`;
            } else if (met7d.percConteudo < 25 && met7d.totalGeralMin > 60) {
                diagEquilibrio = `⚠️ ALERTA: Apenas ${met7d.percConteudo}% do tempo em teoria/conteúdo. Certifique-se de avançar nos novos tópicos do edital.`;
            } else {
                diagEquilibrio = `✅ EXCELENTE EQUILÍBRIO: Rotina balanceada entre Teoria (${met7d.percConteudo}%), Questões (${met7d.percQuestoes}%) e Anki (${met7d.percAnki}%).`;
            }

            const tempoEstudoGeral = {
                ultimos7Dias: {
                    totalGeralHoras: (met7d.totalGeralMin / 60).toFixed(1) + 'h',
                    totalGeralMinutos: met7d.totalGeralMin,
                    ankiHoras: (met7d.totalAnkiMin / 60).toFixed(1) + 'h',
                    conteudoHoras: (met7d.totalConteudoMin / 60).toFixed(1) + 'h',
                    questoesHoras: (met7d.totalQuestoesMin / 60).toFixed(1) + 'h',
                    distribuicaoPercentual: {
                        anki: met7d.percAnki + '%',
                        pomodoroConteudo: met7d.percConteudo + '%',
                        pomodoroQuestoes: met7d.percQuestoes + '%'
                    },
                    mediaDiariaMinutos: met7d.mediaDiariaMin + ' min/dia',
                    diasComEstudo: met7d.diasComEstudo
                },
                ultimos30Dias: {
                    totalGeralHoras: (met30d.totalGeralMin / 60).toFixed(1) + 'h',
                    totalGeralMinutos: met30d.totalGeralMin,
                    ankiHoras: (met30d.totalAnkiMin / 60).toFixed(1) + 'h',
                    conteudoHoras: (met30d.totalConteudoMin / 60).toFixed(1) + 'h',
                    questoesHoras: (met30d.totalQuestoesMin / 60).toFixed(1) + 'h',
                    distribuicaoPercentual: {
                        anki: met30d.percAnki + '%',
                        pomodoroConteudo: met30d.percConteudo + '%',
                        pomodoroQuestoes: met30d.percQuestoes + '%'
                    },
                    mediaDiariaMinutos: met30d.mediaDiariaMin + ' min/dia',
                    diasComEstudo: met30d.diasComEstudo
                },
                diagnosticoEquilibrio: diagEquilibrio
            };

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
                tempoGeralDeEstudo: tempoEstudoGeral,
                editaisCadastrados: editaisResumo,
                simulados: simuladosResumo
            };
        },

        calculateStudyMetrics: function(state, ankiTimeMap, days = 7) {
            state = state || {};
            const pomodoroSessoes = Array.isArray(state.pomodoroSessoes) ? state.pomodoroSessoes : [];
            ankiTimeMap = ankiTimeMap || {};

            const hoje = new Date();
            hoje.setHours(23, 59, 59, 999);

            const diasList = [];
            const dateLookup = {};

            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(hoje);
                d.setDate(hoje.getDate() - i);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const dateKey = `${yyyy}-${mm}-${dd}`;
                const dateShort = `${dd}/${mm}`;

                const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' });
                const baseName = weekday.split('-')[0];
                const capWeekday = baseName.charAt(0).toUpperCase() + baseName.slice(1);

                // 1 semana: Nome do dia da semana (ex: Segunda, Terça, Quarta...)
                // 1 mês: Dia e mês (ex: 09/10, 10/10...)
                const label = (days <= 7) ? capWeekday : dateShort;

                const diaObj = {
                    dateKey: dateKey,
                    dateShort: dateShort,
                    weekday: capWeekday,
                    label: label,
                    ankiMin: 0,
                    conteudoMin: 0,
                    questoesMin: 0,
                    totalMin: 0
                };

                diasList.push(diaObj);
                dateLookup[dateKey] = diaObj;
            }

            pomodoroSessoes.forEach(sessao => {
                if (Array.isArray(sessao.pomodorosLog) && sessao.pomodorosLog.length > 0) {
                    sessao.pomodorosLog.forEach(log => {
                        const completedDate = log.completedAt ? new Date(log.completedAt) : new Date(sessao.dataFim || sessao.dataInicio || 0);
                        if (!isNaN(completedDate.getTime())) {
                            const k = `${completedDate.getFullYear()}-${String(completedDate.getMonth() + 1).padStart(2, '0')}-${String(completedDate.getDate()).padStart(2, '0')}`;
                            if (dateLookup[k]) {
                                const seg = Number(log.duracaoSeg) || ((Number(log.duracaoMin) || 0) * 60) || 1500;
                                const min = Math.round(seg / 60);

                                const cat = (log.categoria || sessao.categoria || '').toLowerCase();
                                const not = (sessao.nota || '').toLowerCase();
                                const isQuest = cat.includes('quest') || not.includes('quest');

                                if (isQuest) {
                                    dateLookup[k].questoesMin += min;
                                } else {
                                    dateLookup[k].conteudoMin += min;
                                }
                            }
                        }
                    });
                } else {
                    const sessaoDate = new Date(sessao.dataFim || sessao.dataInicio || 0);
                    if (!isNaN(sessaoDate.getTime())) {
                        const k = `${sessaoDate.getFullYear()}-${String(sessaoDate.getMonth() + 1).padStart(2, '0')}-${String(sessaoDate.getDate()).padStart(2, '0')}`;
                        if (dateLookup[k]) {
                            const seg = Number(sessao.tempoTotalFocoSeg) || ((Number(sessao.pomodorosConcluidos) || 0) * (Number(sessao.duracaoFoco) || 25) * 60);
                            const min = Math.round(seg / 60);

                            const cat = (sessao.categoria || '').toLowerCase();
                            const not = (sessao.nota || '').toLowerCase();
                            const isQuest = cat.includes('quest') || not.includes('quest');

                            if (isQuest) {
                                dateLookup[k].questoesMin += min;
                            } else {
                                dateLookup[k].conteudoMin += min;
                            }
                        }
                    }
                }
            });

            Object.keys(ankiTimeMap).forEach(k => {
                if (dateLookup[k]) {
                    const ms = ankiTimeMap[k] || 0;
                    const min = ms > 10000 ? Math.round(ms / 60000) : Math.round(ms);
                    dateLookup[k].ankiMin += min;
                }
            });

            let totalAnkiMin = 0;
            let totalConteudoMin = 0;
            let totalQuestoesMin = 0;

            diasList.forEach(d => {
                d.totalMin = d.ankiMin + d.conteudoMin + d.questoesMin;
                totalAnkiMin += d.ankiMin;
                totalConteudoMin += d.conteudoMin;
                totalQuestoesMin += d.questoesMin;
            });

            const totalGeralMin = totalAnkiMin + totalConteudoMin + totalQuestoesMin;

            return {
                dias: diasList,
                totalGeralMin: totalGeralMin,
                totalAnkiMin: totalAnkiMin,
                totalConteudoMin: totalConteudoMin,
                totalQuestoesMin: totalQuestoesMin,
                percAnki: totalGeralMin > 0 ? Math.round((totalAnkiMin / totalGeralMin) * 100) : 0,
                percConteudo: totalGeralMin > 0 ? Math.round((totalConteudoMin / totalGeralMin) * 100) : 0,
                percQuestoes: totalGeralMin > 0 ? Math.round((totalQuestoesMin / totalGeralMin) * 100) : 0,
                diasComEstudo: diasList.filter(d => d.totalMin > 0).length,
                mediaDiariaMin: diasList.length > 0 ? Math.round(totalGeralMin / diasList.length) : 0
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

4. TEMPO GERAL DE ESTUDO (Teoria vs Questões vs Anki):
   - Inspecione sempre a seção 'tempoGeralDeEstudo' (tanto 'ultimos7Dias' quanto 'ultimos30Dias').
   - Avalie o equilíbrio dos 3 pilares vitais de preparação:
     * Pomodoro de Conteúdo (absorção teórica e leitura de PDFs)
     * Pomodoro de Questões (fixação prática, treino de banca e velocidade)
     * Anki (retenção espaçada ativa de longo prazo)
   - Sempre comente sobre o volume total de horas estudadas e a divisão percentual entre essas 3 frentes quando o estudante perguntar sobre seu ritmo, progresso ou planejamento semanal/diário.

5. Editais e Provas:
   - Nunca invente datas de provas. Se constar como "Data da prova ainda não definida pelo órgão", oriente o estudante considerando que é um concurso pré-edital/autorizado, onde a base teórica e a consolidação no Anki são o foco principal.

6. Formato das Respostas:
   - Responda sempre formatando em Markdown com visual limpo e hierárquico:
     * Use '## ' para Títulos Principais / Headlines (ex: '## DIAGNÓSTICO DO DIA', '## PLANO DE AÇÃO PARA HOJE').
     * Use '---' para dividir seções.
     * Use '#### ' para destacar Blocos Práticos de Estudo (ex: '#### Bloco 1: Aquecimento e Limpeza do Anki (Duração: ~30 min)').
     * Inicie os tópicos '-' com o conceito em negrito (ex: '- **Alerta nas Questões:** ...', '- **Objetivo:** ...').
     * Evite blocos extensos de texto; priorize itens fáceis de escanear.
   - Seja conciso, motivador e estratégico.`;
        },

        /**
         * Converte Markdown em HTML seguro e de alta legibilidade para o chat do Mentor.
         */
        formatMarkdown: function(markdownText) {
            if (!markdownText) return '';

            // Escapar tags HTML perigosas primeiro
            let text = String(markdownText)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            // Blocos de código ```linguagem\n ... ```
            text = text.replace(/```([\s\S]*?)```/g, (match, p1) => {
                return `<pre class="bg-gray-900 text-gray-100 rounded-xl p-3.5 my-3 text-xs font-mono overflow-x-auto border border-gray-800 shadow-inner"><code>${p1.trim()}</code></pre>`;
            });

            // Código inline `codigo`
            text = text.replace(/`([^`]+)`/g, '<code class="bg-primary-50 text-primary-700 px-2 py-0.5 rounded text-xs font-mono font-bold border border-primary-100/70">$1</code>');

            // Linha divisória horizontal (--- ou ***)
            text = text.replace(/^(?:---|—|___|\*\*\*)[ \t]*$/gm, '<div class="my-4 border-t border-slate-200/90"></div>');

            // Blocos de Estudo: #### Bloco X: ...
            text = text.replace(/^#### (.*$)/gim, '<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider bg-primary-50 text-primary-700 border border-primary-200/80 mt-4 mb-2 shadow-2xs"><i class="ph-bold ph-lightning text-primary-600"></i><span>$1</span></div>');

            // Subseções: ### Título
            text = text.replace(/^### (.*$)/gim, '<h4 class="text-sm sm:text-base font-black text-gray-900 tracking-wide mt-4 mb-2 flex items-center gap-2"><span class="w-1.5 h-3.5 bg-amber-500 rounded-full inline-block shrink-0"></span><span>$1</span></h4>');

            // Seções principais: ## Título
            text = text.replace(/^## (.*$)/gim, '<h3 class="text-base sm:text-lg font-black text-gray-900 tracking-tight mt-5 mb-2.5 flex items-center gap-2.5 border-b border-gray-100 pb-2"><span class="w-1.5 h-4.5 bg-primary-600 rounded-full inline-block shrink-0"></span><span>$1</span></h3>');

            // Título geral: # Título
            text = text.replace(/^# (.*$)/gim, '<h2 class="text-lg sm:text-xl font-black text-gray-900 tracking-tight mt-6 mb-3 flex items-center gap-2.5 border-b-2 border-primary-100 pb-2"><span class="w-2 h-5 bg-primary-600 rounded-full inline-block shrink-0"></span><span>$1</span></h2>');

            // Linhas avulsas em CAIXA ALTA (ex: "DIAGNÓSTICO DO DIA: HORA DE RETOMAR A TRAÇÃO" ou "PLANO DE AÇÃO PARA HOJE")
            text = text.replace(/^([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ0-9 \-_:]{6,70})$/gm, (match) => {
                const trimmed = match.trim();
                if (trimmed.startsWith('<') || trimmed.startsWith('-')) return match;
                return `<h3 class="text-base sm:text-lg font-black text-gray-900 tracking-tight mt-5 mb-2.5 flex items-center gap-2.5 border-b border-gray-100 pb-2"><span class="w-1.5 h-4.5 bg-primary-600 rounded-full inline-block shrink-0"></span><span>${trimmed}</span></h3>`;
            });

            // Blockquotes (> citação)
            text = text.replace(/^> (.*$)/gim, '<div class="border-l-4 border-primary-500 bg-primary-50/60 pl-3.5 pr-3 py-2 rounded-r-xl my-2.5 text-sm text-gray-700 italic">$1</div>');

            // Negrito **texto**
            text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-black text-gray-900">$1</strong>');

            // Itálico *texto*
            text = text.replace(/\*([^*]+)\*/g, '<em class="italic text-gray-700">$1</em>');

            // Listas não ordenadas (- item ou * item)
            text = text.replace(/^[\*\-] (.*$)/gim, '<li class="text-[13.5px] sm:text-sm text-gray-800 leading-relaxed my-1 pl-1 list-disc ml-5">$1</li>');

            // Listas numeradas (1. item)
            text = text.replace(/^\d+\.\s(.*$)/gim, '<li class="text-[13.5px] sm:text-sm text-gray-800 leading-relaxed my-1 pl-1 list-decimal ml-5">$1</li>');

            // Quebras de linha normais
            text = text.replace(/\n\n+/g, '<div class="my-2.5"></div>');
            text = text.replace(/\n/g, '<br>');

            return text;
        }
    };

    if (typeof window !== 'undefined') {
        window.mentorLogic = mentorLogic;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = mentorLogic;
    }
})();
