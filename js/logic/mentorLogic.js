// js/logic/mentorLogic.js
// Logic for student context assembly, prompt engineering, and markdown formatting

(function() {
    const SYSTEM_PROMPT = `Você é o "Mentor Hyrtinho", mentor de elite para concursos de Tecnologia da Informação (TI).
Seu trabalho é transformar as métricas reais do estudante em diagnóstico e plano de ação específicos para HOJE.

REGRA Nº 1 — ZERO CONTEÚDO GENÉRICO (prioridade máxima):
- Toda linha da resposta deve (a) citar pelo menos um dado concreto do [SNAPSHOT DE MÉTRICAS DO ESTUDANTE] (número, data, nome de conteúdo, tendência) E (b) ser uma conclusão que mudaria se esses dados mudassem.
- Antes de escrever cada linha, aplique o teste: "Esta frase seria igual se o estudante consultasse em outro dia, com outras métricas?" Se sim, APAGUE a linha.
- Frases PROIBIDAS (e qualquer variação delas):
  * "Mantenha o bom ritmo", "continue assim", "siga firme".
  * "Analise os gabaritos comentados", "fixe as pegadinhas", "conceitos mais cobrados pelas bancas".
  * "Faça a leitura ativa", "grife os pontos críticos", "extraia anotações ou flashcards", "destacando os pilares de...".
  * "Regra do Conteúdo Único", "execute exclusivamente este tópico", "um conteúdo por vez".
  * "Escopo Real da Disciplina", "a disciplina continua no edital", "novos tópicos nos ciclos seguintes".
  * "Hoje é [dia da semana]" ou "restam X dias para fechar a semana" como informação isolada (só é permitido se vier acompanhado de páginas/conteúdos restantes e do ritmo necessário).
  * "Sem tempo a perder", "avance imediatamente".
- Não explique metodologia, não dê lição de moral. Se faltar um dado, diga em poucas palavras qual dado falta (ex: "acerto não registrado nas anotações do Pomodoro") em vez de preencher com conselho genérico.
- Use somente dados do snapshot. Nunca invente números.

REGRAS INTERNAS (aplique, mas NUNCA as cite ou explique na resposta):
- Ordem do dia: Anki > Questões > Conteúdo.
- Apenas UM conteúdo teórico por dia: 'cronogramaPorSemanas.semanaAtual.conteudoFocoHoje'. O próximo da fila só é recomendado após o check do atual.
- Nunca diga que uma disciplina inteira termina; o que termina é um tópico ou a semana do cronograma.

ESTRUTURA para pedidos de rotina/plano ("O que devo fazer hoje?", "Rotina em 3 blocos" e similares):

## DIAGNÓSTICO DO DIA
Exatamente 3 bullets, um por pilar, com foco estrito em: (1) CONSISTÊNCIA, (2) ÚLTIMO DIA EM QUE FOI CONCLUÍDO/REALIZADO, e (3) TEMPO DEDICADO NOS ÚLTIMOS 7 DIAS:
- **Anki — [status]:** consistência (dias ativos/7, sequência), último dia realizado (se feito hoje ou há quantos dias), tempo dedicado nos últimos 7 dias (horas/minutos) e status da fila de hoje (se zerada ou com pendências).
- **Questões — [status]:** consistência (dias ativos/7), última sessão realizada (quando foi e matéria estudada), e tempo dedicado nos últimos 7 dias (horas/minutos e matérias treinadas).
- **Conteúdo — [status]:** consistência (dias ativos/7 na teoria), última conclusão/sessão de teoria (quando foi), e tempo dedicado nos últimos 7 dias (horas/minutos e páginas lidas).
Opcional, 4º bullet **Ritmo da Semana:** apenas com 'progressoSemanal' (metas X/Y, páginas restantes, páginas/dia necessárias vs ritmo recente, 'projecao').

---
## PLANO DE AÇÃO PARA HOJE
#### Bloco 1: Anki
- Se 'anki.filaZeradaHoje' = true: título '#### Bloco 1: Anki Concluído (0 min)' e UMA linha informando que a fila do dia está 100% zerada (0 pendências). Proibido inventar tempo ou mandar abrir o Anki.
- Se houver pendências: título '#### Bloco 1: Anki (~X min)' com X = 'anki.tempoRecomendadoHojeMin' e o total de pendências.
#### Bloco 2: Questões — [matéria/tópico] (~X min)
- Tópico-alvo alinhado à matéria em foco do dia ou conteúdos recentes.
- Duração calibrada pela consistência: se questões estiverem em baixa frequência ou parada há 2+ dias, reforce com ~40-50 min; se consistente, use a média de minutos como base.
#### Bloco 3: Conteúdo — [matéria] (~50-60 min)
- Conteúdo e páginas de 'conteudoFocoHoje'.
- Relacione com 'progressoSemanal' (metas concluídas da semana e páginas restantes para o fechamento).
- Se 'conteudoFocoHoje.status' = '100% Concluído', proponha adiantar o próximo conteúdo do cronograma ou reforçar questões.

---
## VISÃO DA SEMANA E PRÓXIMOS PASSOS
Use 'progressoSemanal' e 'proximosPassos':
- **Fechamento da Semana:** 'projecao' numérica com páginas restantes e ritmo necessário.
- **Depois deste tópico:** 'proximoConteudoNaFila'; se for o último, resuma 'proximaSemana' (nº de conteúdos e páginas).
- **[Matéria em foco] no cronograma:** 'coberturaDaMateriaEmFoco' (X/Y tópicos concluídos, próximo tópico futuro e semana, tópicos cadastrados sem agendamento se > 0).
- **Atrasos / Editais:** apenas se houver 'semanasEmAtraso' ou editais cadastrados com dias restantes até a prova.

Para outras perguntas: responda diretamente o que foi perguntado, com a mesma Regra Nº 1, sem forçar a estrutura acima.

FORMATAÇÃO:
- '## ' para títulos principais, '---' entre seções, '#### ' para os 3 blocos.
- Bullets curtos com '-' e rótulo em negrito; métricas em **negrito**.
- Sem floreios.`;

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

            // Dia de estudo: o dia só vira 4h após a meia-noite (estilo Anki)
            const hoje = new Date();
            const hojeEstudo = new Date(hoje.getTime() - 4 * 3600000);
            const hojeISO = `${hojeEstudo.getFullYear()}-${String(hojeEstudo.getMonth() + 1).padStart(2, '0')}-${String(hojeEstudo.getDate()).padStart(2, '0')}`;

            const diasSemanaNome = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
            const diaSemanaIndex = hojeEstudo.getDay();
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
                    status: m.isConcluida ? "Concluída (Check 100%)" : `${m.pendentes} conteúdo(s) pendente(s)`,
                    conteudosPendentes: m.conteudos.filter(c => !c.concluido).map(c => `${c.conteudo} (${c.paginas} pág.)`)
                }));

                // Fila sequencial estrita de conteúdos pendentes da semana
                const pendenciasSemana = [];
                (dados.materiasList || []).forEach(m => {
                    (m.conteudos || []).forEach(c => {
                        if (!c.concluido) {
                            pendenciasSemana.push({
                                materia: m.materia,
                                conteudo: c.conteudo,
                                paginas: c.paginas
                            });
                        }
                    });
                });

                let conteudoFocoHoje = null;
                let proximosConteudosNaFila = [];

                if (pendenciasSemana.length > 0) {
                    const foco = pendenciasSemana[0];
                    conteudoFocoHoje = {
                        materia: foco.materia,
                        conteudo: foco.conteudo,
                        paginas: foco.paginas
                    };

                    proximosConteudosNaFila = pendenciasSemana.slice(1).map((item, idx) => ({
                        posicaoNaFila: idx + 1,
                        materia: item.materia,
                        conteudo: item.conteudo,
                        paginas: item.paginas,
                        liberadoApos: idx === 0 ? foco.conteudo : pendenciasSemana[idx].conteudo
                    }));
                } else if (materiasDaSemana.length > 0) {
                    conteudoFocoHoje = {
                        materia: "Cronograma da semana em dia",
                        status: "100% Concluído",
                        orientacao: "Todos os conteúdos planejados para esta semana já estão concluídos. Usar 'proximosPassos.proximaSemana' e 'diagnosticoPilares.questoes' para decidir entre adiantar conteúdo ou reforçar questões."
                    };
                }

                // Compatibilidade de transição para identificação da matéria ativa
                const primeiraPendente = materiasDaSemana.find(m => !m.isConcluida);
                const materiaFocoAtual = primeiraPendente ? {
                    materia: primeiraPendente.materia,
                    conteudoAtivoHoje: conteudoFocoHoje ? conteudoFocoHoje.conteudo : null,
                    paginasHoje: conteudoFocoHoje ? conteudoFocoHoje.paginas : null,
                    conteudosPendentes: primeiraPendente.conteudosPendentes
                } : null;

                return {
                    semana: sem,
                    ...(observacao ? { observacao: observacao } : {}),
                    totalItensSemana: dados.totalItens,
                    concluidosSemana: dados.concluidos,
                    pendentesSemana: dados.totalItens - dados.concluidos,
                    porcentagemSemana: dados.totalItens > 0 ? Math.round((dados.concluidos / dados.totalItens) * 100) + '%' : '0%',
                    materiasDaSemanaEmOrdem: materiasDaSemana,
                    conteudoFocoHoje: conteudoFocoHoje,
                    proximosConteudosNaFila: proximosConteudosNaFila,
                    materiaFocoAtual: materiaFocoAtual,
                    itensParaEstudarHojeOuNestaSemana: pendenciasSemana
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
            const totalPendentesHoje = ankiData && ankiData.count !== undefined ? ankiData.count : 0;
            const filaZerada = totalPendentesHoje === 0;
            const ankiResumo = {
                status: ankiData && ankiData.success ? 'Conectado' : (ankiData ? 'Offline/Pendente' : 'Não verificado'),
                origem: ankiData?.source || 'indisponível',
                totalPendentesHoje: totalPendentesHoje,
                cardsNovos: ankiData?.breakdown?.new || 0,
                cardsAprendizado: ankiData?.breakdown?.learn || 0,
                cardsRevisao: ankiData?.breakdown?.review || 0,
                filaZeradaHoje: filaZerada,
                tempoRecomendadoHojeMin: filaZerada ? 0 : Math.max(10, Math.min(45, Math.round(totalPendentesHoje * 0.75))),
                diretrizParaIA: filaZerada
                    ? "REVISÕES DO DIA JÁ CONCLUÍDAS (0 pendências). A duração do Bloco 1 deve ser estritamente 0 MINUTOS. NÃO mande abrir o Anki nem invente aquecimentos. Direcione imediatamente para o Bloco 2 de Questões."
                    : `Há ${totalPendentesHoje} cartões devidos hoje. O Bloco 1 deve focar em zerar essas revisões antes de iniciar as questões.`
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

            // 7. Diagnóstico por Pilar (Anki, Questões, Conteúdo) com dados reais dos últimos 14 dias
            const met14d = this.calculateStudyMetrics(state, ankiMap, 14);
            const dias7 = met14d.dias.slice(-7);
            const inicio7Key = dias7[0].dateKey;
            const inicio14Key = met14d.dias[0].dateKey;
            const studyKey = (dt) => this._studyKey(dt);
            const fmtKey = (k) => { const p = String(k).split('-'); return `${p[2]}/${p[1]}`; };
            const diasEntre = (kA, kB) => Math.round((Date.parse(kB + 'T00:00:00') - Date.parse(kA + 'T00:00:00')) / 86400000);
            const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

            // --- Pilar Anki ---
            const pilarAnki = this._pillarActivity(met14d.dias, 'ankiMin');
            pilarAnki.filaHoje = filaZerada ? 'Zerada (0 pendentes)' : `${totalPendentesHoje} cartões devidos`;

            // --- Conclusões de conteúdo com data (base para Conteúdo) ---
            const conclusoes = cronograma.filter(i => i.concluido && i.dataConclusao).map(i => {
                const dt = new Date(i.dataConclusao);
                return {
                    materia: (materiaMap[i.materiaId] || 'Matéria Geral').trim(),
                    conteudo: (conteudoMap[i.conteudoId] || 'Conteúdo').trim(),
                    paginas: Number(i.paginas) || 0,
                    dataObj: dt,
                    dateKey: isNaN(dt.getTime()) ? null : studyKey(dt)
                };
            }).filter(c => c.dateKey).sort((a, b) => b.dataObj - a.dataObj);
            const concl7d = conclusoes.filter(c => c.dateKey >= inicio7Key);

            // --- Pilar Questões ---
            const pilarQuestoes = this._pillarActivity(met14d.dias, 'questoesMin');
            const questSess7d = sessoesQuestoes.filter(s => studyKey(s.dataCompleta) >= inicio7Key);
            const minPorMateriaQuest = {};
            questSess7d.forEach(s => {
                minPorMateriaQuest[s.materia] = (minPorMateriaQuest[s.materia] || 0) + s.duracaoMinutos;
            });
            pilarQuestoes.sessoesUltimos7Dias = questSess7d.length;
            pilarQuestoes.minutosPorMateria7d = Object.entries(minPorMateriaQuest).map(([m, min]) => `${m}: ${min} min`).join(' | ') || 'Nenhuma';
            if (sessoesQuestoes[0]) {
                const u = sessoesQuestoes[0];
                const diffDias = Math.floor((hoje - u.dataCompleta) / (1000 * 60 * 60 * 24));
                pilarQuestoes.quandoFoiUltimaVez = diffDias === 0 ? 'Hoje' : (diffDias === 1 ? 'Ontem' : `Há ${diffDias} dias atrás`);
                pilarQuestoes.materiaUltimaSessao = u.materia;
            } else {
                pilarQuestoes.quandoFoiUltimaVez = 'Nenhuma sessão registrada';
                pilarQuestoes.materiaUltimaSessao = 'Nenhuma';
            }

            // --- Pilar Conteúdo ---
            const pilarConteudo = this._pillarActivity(met14d.dias, 'conteudoMin');
            const pag7d = concl7d.reduce((s, c) => s + c.paginas, 0);
            pilarConteudo.conteudosConcluidos7d = concl7d.length;
            pilarConteudo.paginasConcluidas7d = pag7d;
            if (conclusoes[0]) {
                const diffDias = diasEntre(conclusoes[0].dateKey, hojeISO);
                pilarConteudo.quandoFoiUltimaConclusao = diffDias === 0 ? 'Hoje' : (diffDias === 1 ? 'Ontem' : `Há ${diffDias} dia(s) atrás`);
                pilarConteudo.conteudoUltimaConclusao = `${conclusoes[0].conteudo} (${conclusoes[0].materia})`;
            } else {
                pilarConteudo.quandoFoiUltimaConclusao = 'Nenhum conteúdo com data de conclusão';
            }

            // 8. Progresso real da semana com projeção
            let progressoSemanal = null;
            if (semanaAtualDetalhe && semanasMap[semanaAtualDetalhe.semana]) {
                const semKey = semanaAtualDetalhe.semana;
                const dadosSem = semanasMap[semKey];
                const ehSemanaCorrente = semKey === semanaAtualMonday;
                const diasDisp = ehSemanaCorrente ? diasRestantesAteDomingo + 1 : null;
                const pagRest = dadosSem.totalPaginas - dadosSem.paginasLidas;
                const itensRest = dadosSem.totalItens - dadosSem.concluidos;
                const ritmoPagDia = +(pag7d / 7).toFixed(1);
                const pagDiaNec = diasDisp && pagRest > 0 ? Math.ceil(pagRest / diasDisp) : 0;

                let projecao;
                if (itensRest === 0) {
                    projecao = 'Todas as metas da semana já concluídas.';
                } else if (!ehSemanaCorrente) {
                    projecao = semKey < semanaAtualMonday
                        ? `Semana ${semKey} ainda aberta (atrasada) com ${itensRest} conteúdo(s) e ${pagRest} pág. restantes.`
                        : `Semana ${semKey} é futura: estudante está adiantado; restam ${itensRest} conteúdo(s) e ${pagRest} pág.`;
                } else if (ritmoPagDia === 0) {
                    projecao = `Nenhuma página concluída nos últimos 7 dias; para fechar a semana são necessárias ${pagDiaNec} pág./dia em ${diasDisp} dia(s).`;
                } else {
                    const projetado = Math.round(ritmoPagDia * diasDisp);
                    projecao = projetado >= pagRest
                        ? `No ritmo recente (${ritmoPagDia} pág./dia) a semana fecha com folga de ~${projetado - pagRest} pág.`
                        : `No ritmo recente (${ritmoPagDia} pág./dia) faltarão ~${pagRest - projetado} pág. no domingo; é preciso subir para ${pagDiaNec} pág./dia.`;
                }

                progressoSemanal = {
                    semana: semKey,
                    ehSemanaDoCalendarioAtual: ehSemanaCorrente,
                    metasConcluidas: `${dadosSem.concluidos}/${dadosSem.totalItens}`,
                    paginasLidas: `${dadosSem.paginasLidas}/${dadosSem.totalPaginas}`,
                    paginasRestantes: pagRest,
                    conteudosRestantes: itensRest,
                    conteudosConcluidosDesdeSegunda: conclusoes.filter(c => c.dateKey >= semanaAtualMonday).length,
                    diasDisponiveisIncluindoHoje: diasDisp,
                    paginasPorDiaNecessarias: pagDiaNec,
                    ritmoRecentePaginasPorDia: ritmoPagDia,
                    projecao: projecao
                };
            }

            // 9. Próximos passos concretos (fila, próxima semana, cobertura da matéria, prova)
            const proximosPassos = {};
            if (semanaAtualDetalhe) {
                const semKey = semanaAtualDetalhe.semana;
                const prox = semanaAtualDetalhe.proximosConteudosNaFila[0];
                proximosPassos.proximoConteudoNaFila = prox
                    ? `${prox.conteudo} (${prox.materia}, ${prox.paginas} pág.)`
                    : 'Nenhum: o conteúdo em foco é o último da semana';

                const idxSem = todasSemanas.indexOf(semKey);
                const proxSemKey = idxSem >= 0 ? todasSemanas[idxSem + 1] : null;
                if (proxSemKey) {
                    const d = semanasMap[proxSemKey];
                    proximosPassos.proximaSemana = {
                        semana: proxSemKey,
                        totalConteudos: d.totalItens,
                        totalPaginas: d.totalPaginas,
                        conteudos: d.materiasList.flatMap(m => m.conteudos.map(c => `${c.conteudo} (${m.materia}, ${c.paginas} pág.)`))
                    };
                } else {
                    proximosPassos.proximaSemana = 'Nenhuma semana cadastrada após esta no cronograma';
                }

                const foco = semanaAtualDetalhe.conteudoFocoHoje;
                if (foco && foco.conteudo) {
                    const matIds = materias.filter(m => (m.nome || '').trim() === foco.materia).map(m => m.id);
                    const itensMat = cronograma.filter(i => matIds.includes(i.materiaId));
                    const futuros = itensMat
                        .filter(i => !i.concluido && (i.semana || '') > semKey)
                        .sort((a, b) => String(a.semana || '').localeCompare(String(b.semana || '')));
                    const idsNoCrono = new Set(cronograma.map(i => i.conteudoId));
                    const foraCrono = conteudos.filter(c => matIds.includes(c.materiaId) && !idsNoCrono.has(c.id));
                    proximosPassos.coberturaDaMateriaEmFoco = {
                        materia: foco.materia,
                        topicosConcluidosNoCronograma: `${itensMat.filter(i => i.concluido).length}/${itensMat.length}`,
                        proximoTopicoDaMateriaEmSemanasFuturas: futuros[0]
                            ? `${conteudoMap[futuros[0].conteudoId] || 'Conteúdo'} (semana ${futuros[0].semana})`
                            : 'Nenhum agendado nas próximas semanas',
                        topicosCadastradosSemAgendamento: foraCrono.length
                    };
                }
            }
            proximosPassos.semanasEmAtraso = semanasAtrasadas.length
                ? semanasAtrasadas.map(s => `${s.semana}: ${s.itensPendentes} pendente(s)`)
                : 'Nenhuma';

            if (ankiData && Array.isArray(ankiData.forecast) && ankiData.forecast.length > 1) {
                proximosPassos.revisoesAnkiPrevistas = ankiData.forecast.slice(1, 4)
                    .map(f => `${f.dateShort || f.day}: ${f.count}`).join(' | ');
            }

            // Revisões teóricas agendadas no site (Spaced Repetition de conteúdos concluídos D+1, D+7, D+30, D+90)
            const revisoesPlat = Array.isArray(state.revisoes) ? state.revisoes : [];
            const revsPendentesHoje = revisoesPlat.filter(r => {
                const d = r.dataRevisao ? r.dataRevisao.split('T')[0] : null;
                return d && d <= hojeISO && r.status === 'pendente';
            });
            if (revsPendentesHoje.length > 0) {
                const nomes = revsPendentesHoje.map(r => conteudoMap[r.conteudoId] || 'Conteúdo').slice(0, 3);
                proximosPassos.revisoesTeoricasPlataformaHoje = `${revsPendentesHoje.length} revisão(ões) pendente(s) no site (${nomes.join(', ')})`;
            }

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
                    ultimasSessoesRecentes: ultimasSessoesRecentes,
                    configuracaoPomodoro: `${state.pomodoroConfig?.duracaoFoco || 25} min foco / ${state.pomodoroConfig?.duracaoPausa || 5} min pausa`
                },
                tempoGeralDeEstudo: tempoEstudoGeral,
                diagnosticoPilares: {
                    anki: pilarAnki,
                    questoes: pilarQuestoes,
                    conteudo: pilarConteudo
                },
                progressoSemanal: progressoSemanal,
                proximosPassos: proximosPassos,
                editaisCadastrados: editaisResumo,
                simulados: simuladosResumo
            };
        },

        calculateStudyMetrics: function(state, ankiTimeMap, days = 7) {
            state = state || {};
            const pomodoroSessoes = Array.isArray(state.pomodoroSessoes) ? state.pomodoroSessoes : [];
            ankiTimeMap = ankiTimeMap || {};

            // Dia de estudo: o dia só vira 4h após a meia-noite (estilo Anki)
            const STUDY_OFFSET_MS = 4 * 3600000;
            const studyKey = (dt) => {
                const s = new Date(dt.getTime() - STUDY_OFFSET_MS);
                return `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}-${String(s.getDate()).padStart(2, '0')}`;
            };
            const hoje = new Date(Date.now() - STUDY_OFFSET_MS);
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
                            const k = studyKey(completedDate);
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
                        const k = studyKey(sessaoDate);
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

        /** Chave YYYY-MM-DD do dia de estudo (vira às 4h, estilo Anki). */
        _studyKey: function(dt) {
            const s = new Date(dt.getTime() - 4 * 3600000);
            return `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}-${String(s.getDate()).padStart(2, '0')}`;
        },

        /**
         * Analisa a atividade de um pilar a partir de 14 dias cronológicos (último = hoje).
         * Compara os últimos 7 dias com os 7 anteriores e calcula frequência/sequência.
         */
        _pillarActivity: function(dias14, field) {
            const vals = dias14.map(d => d[field] || 0);
            const ult = dias14.slice(-7);
            const ant = dias14.slice(0, -7);
            const sum = arr => arr.reduce((s, d) => s + (d[field] || 0), 0);
            const min7 = sum(ult);
            const minAnt = sum(ant);
            const diasAtivos = ult.filter(d => (d[field] || 0) > 0).length;

            const last = vals.length - 1;
            const feitoHoje = vals[last] > 0;
            let i = feitoHoje ? last : last - 1;
            let seq = 0;
            while (i >= 0 && vals[i] > 0) { seq++; i--; }
            let ultimoIdx = -1;
            for (let j = last; j >= 0; j--) { if (vals[j] > 0) { ultimoIdx = j; break; } }
            const diasDesde = ultimoIdx === -1 ? null : last - ultimoIdx;

            let status;
            if (diasDesde === null) status = 'Parado (nenhum registro em 14 dias)';
            else if (diasDesde >= 3) status = `Parado há ${diasDesde} dias`;
            else if (diasAtivos >= 5) status = 'Consistente';
            else if (diasAtivos >= 3) status = 'Irregular';
            else status = 'Baixa frequência';

            return {
                status: status,
                feitoHoje: feitoHoje,
                diasAtivosUltimos7: `${diasAtivos}/7`,
                diasConsecutivos: seq,
                diasDesdeUltimaAtividade: diasDesde,
                minutosUltimos7Dias: min7,
                horasUltimos7Dias: +(min7 / 60).toFixed(1) + 'h',
                minutosPorDia7d: ult.map(d => `${(d.weekday || '').slice(0, 3)} ${d.dateShort}: ${d[field] || 0}`).join(' | ')
            };
        },

        /**
         * Gera o System Instruction especializado para o Mentor de Concursos TI.
         */
        buildSystemPrompt: function() {
            return SYSTEM_PROMPT;
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
