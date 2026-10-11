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

    console.log("✅ Todos os testes de mentorLogic passaram com sucesso!");
}

runTests();
