// js/tests/mentorLogic.test.js
const logic = require('../logic/mentorLogic.js');

function runTests() {
    console.log("Iniciando testes de mentorLogic com semanas...");

    // Teste 1: Agregação de Contexto com Estado Vazio
    const ctxEmpty = logic.buildStudentContext({}, null);
    if (!ctxEmpty.estudante) throw new Error("Deveria conter objeto estudante");
    if (ctxEmpty.cronogramaPorSemanas.totalSemanasPlanejadas !== 0) throw new Error("Total de semanas deveria ser 0");
    if (ctxEmpty.anki.totalPendentesHoje !== 0) throw new Error("Anki pendentes deveria ser 0");

    // Teste 2: Agregação com Dados Reais Simulados Organizados por Semana
    const mockState = {
        currentUser: 'Hyrton',
        displayName: 'Hyrton Carneiro',
        materias: [
            { id: 'm1', nome: 'Banco de Dados' },
            { id: 'm2', nome: 'Redes de Computadores' }
        ],
        conteudos: [
            { id: 'c1', materiaId: 'm1', nome: 'SQL Básico', paginas: 20 },
            { id: 'c2', materiaId: 'm2', nome: 'Modelo OSI', paginas: 35 }
        ],
        cronograma: [
            { id: 'item1', semana: '2026-10-05', materiaId: 'm1', conteudoId: 'c1', concluido: true },
            { id: 'item2', semana: '2026-10-12', materiaId: 'm2', conteudoId: 'c2', concluido: false }
        ],
        editais: [
            { id: 'ed1', nome: 'Banco do Brasil (BB)', dataProva: '' }
        ],
        estatisticas: { streak: 12 },
        pomodoroSessoes: [
            {
                dataInicio: new Date().toISOString(),
                categoria: 'Questões',
                materia: 'Banco de Dados',
                tempoTotalFocoSeg: 3000,
                duracaoFoco: 25,
                pomodorosConcluidos: 2,
                nota: '35 questões resolvidas, 85% de acertos'
            }
        ]
    };

    const mockAnki = {
        success: true,
        source: 'local',
        count: 42,
        breakdown: { new: 10, learn: 5, review: 27 }
    };

    const ctx = logic.buildStudentContext(mockState, mockAnki);

    if (ctx.estudante.usuario !== 'Hyrton') throw new Error("Usuário incorreto");
    if (ctx.estudante.streakDias !== 12) throw new Error("Streak incorreto");
    if (ctx.cronogramaPorSemanas.totalSemanasPlanejadas !== 2) throw new Error("Deveria ter 2 semanas planejadas");
    if (ctx.cronogramaPorSemanas.semanasCompletadas100Porcento !== 1) throw new Error("Deveria ter 1 semana 100% concluída");
    if (ctx.cronogramaPorSemanas.taxaConclusaoSemanas !== '50%') throw new Error("Taxa de semanas deveria ser 50%");
    if (ctx.editaisCadastrados[0].dataProva !== 'Ainda não definida') throw new Error("Data do BB deveria ser 'Ainda não definida'");
    if (ctx.simulados !== 'Nenhum simulado cadastrado ou realizado até o momento.') throw new Error("Simulados deveriam constar como vazios");
    if (ctx.anki.totalPendentesHoje !== 42) throw new Error("Anki total pendente incorreto");
    if (!ctx.pomodoroEFoco.analiseEspecialQuestoes) throw new Error("Deveria conter análise de questões");
    if (ctx.pomodoroEFoco.analiseEspecialQuestoes.materiaEstudadaNaUltimaSessao !== 'Banco de Dados') throw new Error("Matéria da última sessão de questões incorreta");
    if (ctx.pomodoroEFoco.analiseEspecialQuestoes.diasSemFazerQuestoes !== 0) throw new Error("Dias sem questões deveria ser 0 (hoje)");
    if (!ctx.pomodoroEFoco.analiseEspecialQuestoes.anotacoesRegistradasNaSessao.includes('35 questões')) throw new Error("Nota da sessão de questões incorreta");

    // Teste 3: Formatação Markdown
    const markdown = "### Título\n**Importante**: Estude `SQL` hoje!\n- Item 1\n- Item 2";
    const html = logic.formatMarkdown(markdown);
    if (!html.includes('<h4')) throw new Error("Falha ao converter cabeçalho h3/h4");
    if (!html.includes('<strong class="font-black text-gray-900">Importante</strong>')) throw new Error("Falha ao converter negrito");

    // Teste 4: Formatação de Headlines, Divisores e Blocos Práticos
    const complexMd = "DIAGNÓSTICO DO DIA: HORA DE ACELERAR\n\n---\n\n#### Bloco 1: Aquecimento e Anki\n- **Objetivo:** 40 cards";
    const complexHtml = logic.formatMarkdown(complexMd);
    if (!complexHtml.includes('ph-lightning')) throw new Error("Falha ao converter bloco de estudo #### em badge com ícone");
    if (!complexHtml.includes('border-t')) throw new Error("Falha ao converter divisor --- em linha horizontal");
    // Teste 5: Fila Sequencial de Conteúdos e Anki Zerado
    const mockState2 = {
        currentUser: 'Hyrton',
        materias: [{ id: 'm1', nome: 'Banco de Dados' }],
        conteudos: [
            { id: 'c1', materiaId: 'm1', nome: 'TI04 - SQL (DDL)', paginas: 55 },
            { id: 'c2', materiaId: 'm1', nome: 'TI05 - SQL (DCL e DTL)', paginas: 37 }
        ],
        cronograma: [
            { id: 'i1', semana: '2026-10-12', materiaId: 'm1', conteudoId: 'c1', concluido: false },
            { id: 'i2', semana: '2026-10-12', materiaId: 'm1', conteudoId: 'c2', concluido: false }
        ]
    };
    const ctxZerado = logic.buildStudentContext(mockState2, { count: 0, success: true });
    if (ctxZerado.anki.totalPendentesHoje !== 0) throw new Error("Anki deveria ter 0 pendentes");
    if (ctxZerado.anki.filaZeradaHoje !== true) throw new Error("filaZeradaHoje deveria ser true");
    if (ctxZerado.anki.tempoRecomendadoHojeMin !== 0) throw new Error("tempoRecomendadoHojeMin deveria ser 0");

    const semAtual = ctxZerado.cronogramaPorSemanas.semanaAtual;
    if (!semAtual) throw new Error("Deveria conter semanaAtual");
    if (!semAtual.conteudoFocoHoje || semAtual.conteudoFocoHoje.conteudo !== 'TI04 - SQL (DDL)') {
        throw new Error("conteudoFocoHoje deveria ser exclusivamente o 1º item: TI04 - SQL (DDL)");
    }
    if (semAtual.proximosConteudosNaFila.length !== 1 || semAtual.proximosConteudosNaFila[0].conteudo !== 'TI05 - SQL (DCL e DTL)') {
        throw new Error("TI05 deveria estar em proximosConteudosNaFila aguardando conclusão do 1º item");
    }
    if (semAtual.visaoEstrategicaDaSemana !== undefined) {
        throw new Error("visaoEstrategicaDaSemana (textos genéricos) não deveria mais existir");
    }
    if (semAtual.conteudoFocoHoje.diretrizEstudoHoje !== undefined) {
        throw new Error("diretrizEstudoHoje (texto fixo) não deveria mais existir");
    }

    // Teste 6: Diagnóstico por pilar, progresso semanal e próximos passos com dados reais
    const DAY = 86400000;
    const agora = Date.now();
    const keyOf = (ms) => {
        const s = new Date(ms - 4 * 3600000);
        return `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}-${String(s.getDate()).padStart(2, '0')}`;
    };
    const mondayOf = (ms) => {
        const s = new Date(ms - 4 * 3600000);
        const day = s.getDay();
        s.setDate(s.getDate() - day + (day === 0 ? -6 : 1));
        return keyOf(s.getTime() + 4 * 3600000);
    };
    const semAtualKey = mondayOf(agora);
    const proxSemKey = mondayOf(agora + 7 * DAY);
    const mockState3 = {
        materias: [{ id: 'm1', nome: 'Banco de Dados' }],
        conteudos: [
            { id: 'c1', materiaId: 'm1', nome: 'TI05 - SQL DCL' },
            { id: 'c2', materiaId: 'm1', nome: 'TI06 - BI' },
            { id: 'c3', materiaId: 'm1', nome: 'TI07 - NoSQL' },
            { id: 'c4', materiaId: 'm1', nome: 'TI08 - Big Data' }
        ],
        cronograma: [
            { id: 'a', semana: semAtualKey, materiaId: 'm1', conteudoId: 'c1', paginas: 40, concluido: true, dataConclusao: new Date(agora - 2 * DAY).toISOString() },
            { id: 'b', semana: semAtualKey, materiaId: 'm1', conteudoId: 'c2', paginas: 84, concluido: false },
            { id: 'c', semana: proxSemKey, materiaId: 'm1', conteudoId: 'c3', paginas: 50, concluido: false }
        ],
        pomodoroSessoes: [
            { dataInicio: new Date(agora - 5 * DAY).toISOString(), categoria: 'Questões', materia: 'Banco de Dados', tempoTotalFocoSeg: 2400, nota: '30 questões, 80%' },
            { dataInicio: new Date(agora - 3 * DAY).toISOString(), categoria: 'Teoria', materia: 'Banco de Dados', tempoTotalFocoSeg: 3600 }
        ]
    };
    const ctx3 = logic.buildStudentContext(mockState3, { count: 0, success: true });
    const pil = ctx3.diagnosticoPilares;
    if (!pil || !pil.anki || !pil.questoes || !pil.conteudo) throw new Error("diagnosticoPilares deveria conter os 3 pilares");
    
    // Foco do Pilar Questões: Consistência, Último dia realizado e Tempo dedicado 7d
    if (pil.questoes.diasDesdeUltimaAtividade !== 5) throw new Error(`Questões: dias desde última atividade deveria ser 5, foi ${pil.questoes.diasDesdeUltimaAtividade}`);
    if (!pil.questoes.status.startsWith('Parado há 5')) throw new Error(`Status de questões incorreto: ${pil.questoes.status}`);
    if (pil.questoes.minutosUltimos7Dias !== 40) throw new Error(`Minutos 7d de questões deveria ser 40, foi ${pil.questoes.minutosUltimos7Dias}`);
    if (pil.questoes.materiaUltimaSessao !== 'Banco de Dados') throw new Error("Matéria da última sessão de questões incorreta");
    if (!pil.questoes.quandoFoiUltimaVez.includes('5 dias')) throw new Error("quandoFoiUltimaVez de questões incorreto");

    // Validação de que GAPs de estudo e taxa de acerto/anotações foram removidos
    if (pil.questoes.conteudosConcluidosAindaSemQuestoes !== undefined) {
        throw new Error("conteudosConcluidosAindaSemQuestoes (gaps de estudo) deve ser removido");
    }
    if (pil.questoes.taxaAcertoRegistrada7d !== undefined) {
        throw new Error("taxaAcertoRegistrada7d deve ser removido");
    }

    // Foco do Pilar Conteúdo: Consistência, Último dia concluído e Tempo dedicado 7d
    if (pil.conteudo.paginasConcluidas7d !== 40) throw new Error("Páginas concluídas 7d deveriam ser 40");
    if (pil.conteudo.minutosUltimos7Dias !== 60) throw new Error("Minutos 7d de conteúdo deveriam ser 60");
    if (!pil.conteudo.quandoFoiUltimaConclusao.includes('2 dia')) throw new Error("quandoFoiUltimaConclusao de conteúdo incorreto");

    // Validação de que comparação com semana anterior e cálculo de min/pág foram removidos
    if (pil.conteudo.conteudosConcluidosSemanaAnterior !== undefined) {
        throw new Error("conteudosConcluidosSemanaAnterior deve ser removido");
    }
    if (pil.conteudo.minutosPorPaginaMedio7d !== undefined) {
        throw new Error("minutosPorPaginaMedio7d deve ser removido");
    }

    // Foco do Pilar Anki: Consistência, Último dia e Tempo dedicado 7d
    if (pil.anki.status !== 'Parado (nenhum registro em 14 dias)') throw new Error(`Status Anki sem dados incorreto: ${pil.anki.status}`);
    if (pil.anki.filaHoje !== 'Zerada (0 pendentes)') throw new Error("Fila hoje do Anki incorreta");

    // Validação de que métricas de cards/taxa de acerto/tempo médio por card do Anki foram removidas
    if (pil.anki.cardsRespondidos7d !== undefined || pil.anki.taxaAcerto7d !== undefined || pil.anki.segundosPorCard !== undefined) {
        throw new Error("Métricas de cards 7d / acerto / segundos por card do Anki devem ser removidas");
    }

    const foco3 = ctx3.cronogramaPorSemanas.semanaAtual.conteudoFocoHoje;
    if (foco3.conteudo !== 'TI06 - BI') throw new Error("Foco deveria ser TI06 - BI");
    if (foco3.tempoEstimadoPeloSeuRitmo !== undefined) {
        throw new Error("tempoEstimadoPeloSeuRitmo deve ser removido");
    }

    const prog = ctx3.progressoSemanal;
    if (!prog || prog.metasConcluidas !== '1/2' || prog.paginasRestantes !== 84) throw new Error("progressoSemanal incorreto");
    if (!prog.projecao || !/pág/.test(prog.projecao)) throw new Error("Projeção semanal deveria ser numérica");
    
    const pp = ctx3.proximosPassos;
    if (!pp.proximaSemana || pp.proximaSemana.totalPaginas !== 50) throw new Error("proximaSemana deveria ter 50 páginas");
    if (pp.coberturaDaMateriaEmFoco.topicosConcluidosNoCronograma !== '1/3') throw new Error("Cobertura da matéria deveria ser 1/3");
    if (!pp.coberturaDaMateriaEmFoco.proximoTopicoDaMateriaEmSemanasFuturas.includes('TI07')) throw new Error("Próximo tópico futuro deveria ser TI07");
    if (pp.coberturaDaMateriaEmFoco.topicosCadastradosSemAgendamento !== 1) throw new Error("Deveria haver 1 tópico (TI08) sem agendamento");

    // Validação de que cruzamento de cronograma com prova mais próxima foi removido
    if (pp.provaMaisProxima !== undefined) {
        throw new Error("proximosPassos.provaMaisProxima (cruzamento de edital) deve ser removido");
    }

    // Teste 7: Prompt não deve conter instruções que geram frases genéricas
    const prompt = logic.buildSystemPrompt();
    if (!prompt.includes('ZERO CONTEÚDO GENÉRICO')) throw new Error("Prompt deveria conter a regra anti-genérico");
    if (prompt.includes('Informe sucintamente o dia atual')) throw new Error("Prompt não deveria mais pedir o dia da semana isolado");
    if (prompt.includes('Ler ativamente o material/PDF')) throw new Error("Prompt não deveria mais conter instrução genérica de leitura");

    console.log("✅ Todos os testes de mentorLogic passaram com sucesso!");
}

runTests();

