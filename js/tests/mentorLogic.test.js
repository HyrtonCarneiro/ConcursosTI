// js/tests/mentorLogic.test.js
const logic = require('../logic/mentorLogic.js');

function runTests() {
    console.log("Iniciando testes de mentorLogic...");

    // Teste 1: Agregação de Contexto com Estado Vazio
    const ctxEmpty = logic.buildStudentContext({}, null);
    if (!ctxEmpty.estudante) throw new Error("Deveria conter objeto estudante");
    if (ctxEmpty.cronograma.totalMetas !== 0) throw new Error("Total de metas deveria ser 0");
    if (ctxEmpty.anki.totalPendentesHoje !== 0) throw new Error("Anki pendentes deveria ser 0");

    // Teste 2: Agregação com Dados Reais Simulados
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
            { id: 'item1', materiaId: 'm1', conteudoId: 'c1', concluido: true },
            { id: 'item2', materiaId: 'm2', conteudoId: 'c2', concluido: false }
        ],
        editais: [
            { id: 'ed1', nome: 'TSE Unificado', dataProva: '2026-12-10' }
        ],
        estatisticas: { streak: 12 },
        pomodoroSessoes: [
            {
                dataInicio: new Date().toISOString(),
                tempoTotalFocoSeg: 1500,
                duracaoFoco: 25,
                pomodorosConcluidos: 1
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
    if (ctx.cronograma.totalMetas !== 2) throw new Error("Total de metas incorreto");
    if (ctx.cronograma.concluidas !== 1) throw new Error("Concluídas incorreto");
    if (ctx.cronograma.pendentes !== 1) throw new Error("Pendentes incorreto");
    if (ctx.cronograma.porcentagemGeral !== '50%') throw new Error("Porcentagem incorreta");
    if (ctx.cronograma.distribuicaoPendencias['Redes de Computadores'] !== 1) throw new Error("Pendência de matéria incorreta");
    if (ctx.anki.totalPendentesHoje !== 42) throw new Error("Anki total pendente incorreto");
    if (ctx.anki.cardsRevisao !== 27) throw new Error("Cards de revisão do Anki incorretos");
    if (ctx.focoEPomodoro.minutosHoje < 25) throw new Error("Tempo de foco hoje incorreto");

    // Teste 3: Formatação Markdown
    const markdown = "### Título\n**Importante**: Estude `SQL` hoje!\n- Item 1\n- Item 2";
    const html = logic.formatMarkdown(markdown);
    if (!html.includes('<h4')) throw new Error("Falha ao converter cabeçalho h3/h4");
    if (!html.includes('<strong class="font-black text-gray-900">Importante</strong>')) throw new Error("Falha ao converter negrito");
    if (!html.includes('<code')) throw new Error("Falha ao converter código inline");
    if (!html.includes('<li')) throw new Error("Falha ao converter lista");

    console.log("✅ Todos os testes de mentorLogic passaram com sucesso!");
}

runTests();
