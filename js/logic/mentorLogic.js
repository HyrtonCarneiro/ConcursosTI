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

            const diasSemanaNome = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
            const diaSemanaIndex = hoje.getDay();
            const diaSemanaNome = diasSemanaNome[diaSemanaIndex];
            const diasRestantesAteDomingo = diaSemanaIndex === 0 ? 0 : 7 - diaSemanaIndex;

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
                        materiasMap: {},
                        materiasList: [],
                        pendencias: []
                    };
                }
                semanasMap[sem].totalItens++;
                const pag = Number(item.paginas) || 0;
                semanasMap[sem].totalPaginas += pag;

                const nomeMat = (materiaMap[item.materiaId] || 'Matéria Geral').trim();
                const nomeCont = (conteudoMap[item.conteudoId] || 'Conteúdo').trim();
                const isConcluido = !!item.concluido;

                if (!semanasMap[sem].materiasMap[nomeMat]) {
                    const matObj = {
                        materia: nomeMat,
                        totalItens: 0,
                        concluidos: 0,
                        pendentes: 0,
                        isConcluida: false,
                        conteudos: []
                    };
                    semanasMap[sem].materiasMap[nomeMat] = matObj;
                    semanasMap[sem].materiasList.push(matObj);
                }

                const currentMat = semanasMap[sem].materiasMap[nomeMat];
                currentMat.totalItens++;
                currentMat.conteudos.push({
                    conteudo: nomeCont,
                    paginas: pag,
                    concluido: isConcluido
                });

                if (isConcluido) {
                    semanasMap[sem].concluidos++;
                    semanasMap[sem].paginasLidas += pag;
                    currentMat.concluidos++;
                } else {
                    currentMat.pendentes++;
                    semanasMap[sem].pendencias.push({
                        materia: nomeMat,
                        conteudo: nomeCont,
                        paginas: pag
                    });
                }
                currentMat.isConcluida = currentMat.totalItens > 0 && currentMat.concluidos === currentMat.totalItens;
            });

            const todasSemanas = Object.keys(semanasMap).sort();
            const totalSemanas = todasSemanas.length;
            let semanasConcluidas = 0;
            const semanasAtrasadas = [];
            let semanaAtualDetalhe = null;
            let totalConteudosGeral = 0;
            let conteudosConcluidosGeral = 0;

            const buildSemanaDetalhe = (sem, observacao = null) => {
                const dados = semanasMap[sem];
                if (!dados) return null;

                const materiasDaSemana = (dados.materiasList || []).map(m => ({
                    materia: m.materia,
                    totalItens: m.totalItens,
                    concluidos: m.concluidos,
                    pendentes: m.pendentes,
                    isConcluida: m.isConcluida,
                    status: m.isConcluida ? "CONCLUÍDA (Check 100%)" : `${m.pendentes} conteúdo(s) pendente(s)`,
                    conteudosPendentes: m.conteudos.filter(c => !c.concluido).map(c => `${c.conteudo} (${c.paginas} pág.)`)
                }));

                const primeiraPendente = materiasDaSemana.find(m => !m.isConcluida);
                let materiaFocoAtual = null;
                let proximasMateriasAguardando = [];

                if (primeiraPendente) {
                    materiaFocoAtual = {
                        materia: primeiraPendente.materia,
                        status: "EM ANDAMENTO - FOCO ÚNICO OBRIGATÓRIO DE HOJE",
                        conteudosPendentes: primeiraPendente.conteudosPendentes,
                        orientacao: `O estudante deve dedicar 100% do tempo do cronograma a '${primeiraPendente.materia}' até dar o check de conclusão em todos os seus conteúdos. NÃO fragmentar o dia estudando outra matéria em outra fase.`
                    };
                    const idx = materiasDaSemana.findIndex(m => m.materia === primeiraPendente.materia);
                    proximasMateriasAguardando = materiasDaSemana.slice(idx + 1).map(m => ({
                        materia: m.materia,
                        status: "BLOQUEADA - AGUARDANDO CONCLUSÃO DA MATÉRIA ANTERIOR",
                        aviso: `NÃO iniciar hoje. Iniciar somente após a conclusão completa (check de todos os itens) de '${primeiraPendente.materia}'.`
                    }));
                } else if (materiasDaSemana.length > 0) {
                    materiaFocoAtual = {
                        materia: "Todas as matérias da semana concluídas!",
                        status: "100% CONCLUÍDO",
                        orientacao: "Todas as matérias desta semana já foram concluídas com check. O estudante pode avançar para a próxima semana ou dedicar-se a questões e revisões do Anki."
                    };
                }

                let visaoEstrategicaDaSemana = null;
                if (primeiraPendente) {
                    const alertaTempo = diasRestantesAteDomingo <= 3
                        ? `Atenção ao calendário: hoje é ${diaSemanaNome} e restam apenas ${diasRestantesAteDomingo} dia(s) para o encerramento da semana. É prioritário acelerar a conclusão dos conteúdos restantes de '${primeiraPendente.materia}' hoje.`
                        : `Hoje é ${diaSemanaNome} (faltam ${diasRestantesAteDomingo} dias para fechar a semana).`;

                    visaoEstrategicaDaSemana = {
                        diaAtual: diaSemanaNome,
                        diasRestantesNaSemana: diasRestantesAteDomingo,
                        urgenciaCalendario: diasRestantesAteDomingo <= 3 ? "ALTA (Reta final da semana)" : "REGULAR (Meio da semana)",
                        alerta: alertaTempo,
                        metaDeHoje: `Concluir os conteúdos pendentes de '${primeiraPendente.materia}' (${primeiraPendente.conteudosPendentes.join(', ')})`,
                        planoDiasSeguintes: proximasMateriasAguardando.length > 0
                            ? `Liberar o início de '${proximasMateriasAguardando.map(p => p.materia).join(', ')}' nos dias seguintes da semana assim que o check for feito`
                            : "Garantir 100% de conclusão da semana sem atrasos"
                    };
                }

                return {
                    semana: sem,
                    ...(observacao ? { observacao: observacao } : {}),
                    totalItensSemana: dados.totalItens,
                    concluidosSemana: dados.concluidos,
                    pendentesSemana: dados.totalItens - dados.concluidos,
                    porcentagemSemana: dados.totalItens > 0 ? Math.round((dados.concluidos / dados.totalItens) * 100) + '%' : '0%',
                    materiasDaSemanaEmOrdem: materiasDaSemana,
                    materiaFocoAtual: materiaFocoAtual,
                    proximasMateriasAguardandoConclusao: proximasMateriasAguardando,
                    visaoEstrategicaDaSemana: visaoEstrategicaDaSemana,
                    regraEstudoSequencial: "O cronograma é SEMANAL. Se a semana tem 2 ou mais matérias, o estudante NÃO DEVE dividir o dia entre matérias diferentes. Ele deve focar e esgotar exclusivamente a matéria atual ('materiaFocoAtual') até dar o check de conclusão de todos os seus itens no cronograma. A recomendação de iniciar a próxima matéria deve ocorrer APENAS após o check de conclusão da primeira ter sido feito.",
                    itensParaEstudarHojeOuNestaSemana: dados.pendencias
                };
            };

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
                        materiasAtrasadas: dados.materiasList.filter(m => !m.isConcluida).map(m => `${m.materia} (${m.pendentes} pendentes)`)
                    });
                }

                // Identifica a semana atual
                if (sem === semanaAtualMonday) {
                    semanaAtualDetalhe = buildSemanaDetalhe(sem);
                }
            });

            // Se a semana do calendário atual não estiver registrada no cronograma, usa a próxima ativa não concluída
            if (!semanaAtualDetalhe && todasSemanas.length > 0) {
                const primeiraNaoConcluida = todasSemanas.find(s => semanasMap[s].concluidos < semanasMap[s].totalItens) || todasSemanas[0];
                semanaAtualDetalhe = buildSemanaDetalhe(primeiraNaoConcluida, "Próxima Semana de Estudos em Aberto");
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
