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
    if (!semAtual.visaoEstrategicaDaSemana.avisoEscopoDisciplina.includes("NÃO se encerra esta semana")) {
        throw new Error("Deveria conter aviso de que a disciplina não termina esta semana");
    }

    console.log("✅ Todos os testes de mentorLogic passaram com sucesso!");
}

runTests();

