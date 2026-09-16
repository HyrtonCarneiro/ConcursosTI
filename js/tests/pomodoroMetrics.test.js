const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = {
    addEventListener: () => {},
    utils: {
        showToast: () => {}
    },
    store: {
        getState: () => ({
            pomodoroConfig: null,
            pomodoroCategorias: ['Semana 1', 'Semana 2', 'Semana 3', 'Questões'],
            pomodoroSessoes: [],
            materias: [{ id: '1', nome: 'Banco de Dados' }, { id: '2', nome: 'Geral' }],
            cronograma: []
        }),
        removePomodoroSessao: () => {},
        updatePomodoroSessaoNota: () => {},
        save: () => {}
    },
    pomodoroLogic: {
        formatDuration: (sec) => {
            const m = Math.round(sec / 60);
            const h = Math.floor(m / 60);
            const remM = m % 60;
            if (h > 0) return `${h}h ${remM}min`;
            return `${remM}min`;
        }
    }
};

global.document = {
    title: '',
    getElementById: (id) => ({
        innerHTML: '',
        value: '',
        addEventListener: () => {},
        classList: { add: () => {}, remove: () => {} }
    })
};

// Load pomodoroController code
const controllerCode = fs.readFileSync(path.join(__dirname, '../controllers/pomodoroController.js'), 'utf8');
eval(controllerCode);
const controller = window.pomodoroController;

async function runTests() {
    console.log("Iniciando testes das métricas do Pomodoro...");

    // Setup mock data simulating user's scenario:
    // Today is Wednesday
    // Sessions:
    // - 6 days ago (Thursday): 3m in Banco de Dados (Semana 2)
    // - 5 days ago (Friday): 59m in Banco de Dados (Semana 2)
    // - 1 day ago (Tuesday): 68m (39m Banco de Dados / Semana 3, 29m Geral / Questões)
    // - Earlier this month (10 days ago): 100m in Banco de Dados (Semana 1)
    
    const now = new Date();
    const makeDate = (daysAgo, hours = 14) => {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, hours, 0, 0);
        return d.toISOString();
    };

    const mockSessions = [
        {
            id: 'sess_1',
            dataInicio: makeDate(10),
            materia: 'Banco de Dados',
            categoria: 'Semana 1',
            pomodorosConcluidos: 2,
            tempoTotalFocoSeg: 6000, // 100m
            pomodorosLog: [
                { id: 'p1', completedAt: makeDate(10, 10), duracaoSeg: 3000, materia: 'Banco de Dados', categoria: 'Semana 1' },
                { id: 'p2', completedAt: makeDate(10, 11), duracaoSeg: 3000, materia: 'Banco de Dados', categoria: 'Semana 1' }
            ]
        },
        {
            id: 'sess_2',
            dataInicio: makeDate(6), // Thursday of last week
            materia: 'Banco de Dados',
            categoria: 'Semana 2',
            pomodorosConcluidos: 1,
            tempoTotalFocoSeg: 180, // 3m
            pomodorosLog: [
                { id: 'p3', completedAt: makeDate(6, 15), duracaoSeg: 180, materia: 'Banco de Dados', categoria: 'Semana 2' }
            ]
        },
        {
            id: 'sess_3',
            dataInicio: makeDate(5), // Friday of last week
            materia: 'Banco de Dados',
            categoria: 'Semana 2',
            pomodorosConcluidos: 2,
            tempoTotalFocoSeg: 3540, // 59m
            pomodorosLog: [
                { id: 'p4', completedAt: makeDate(5, 14), duracaoSeg: 1770, materia: 'Banco de Dados', categoria: 'Semana 2' },
                { id: 'p5', completedAt: makeDate(5, 15), duracaoSeg: 1770, materia: 'Banco de Dados', categoria: 'Semana 2' }
            ]
        },
        {
            id: 'sess_4',
            dataInicio: makeDate(1), // Tuesday
            materia: 'Banco de Dados',
            categoria: 'Semana 3',
            pomodorosConcluidos: 1,
            tempoTotalFocoSeg: 2340, // 39m
            pomodorosLog: [
                { id: 'p6', completedAt: makeDate(1, 9), duracaoSeg: 2340, materia: 'Banco de Dados', categoria: 'Semana 3' }
            ]
        },
        {
            id: 'sess_5',
            dataInicio: makeDate(1), // Tuesday
            materia: 'Geral',
            categoria: 'Questões',
            pomodorosConcluidos: 1,
            tempoTotalFocoSeg: 1740, // 29m
            pomodorosLog: [
                { id: 'p7', completedAt: makeDate(1, 11), duracaoSeg: 1740, materia: 'Geral', categoria: 'Questões' }
            ]
        }
    ];

    window.store.getState = () => ({
        pomodoroConfig: null,
        pomodoroCategorias: ['Semana 1', 'Semana 2', 'Semana 3', 'Questões'],
        pomodoroSessoes: mockSessions,
        materias: [{ id: '1', nome: 'Banco de Dados' }, { id: '2', nome: 'Geral' }],
        cronograma: []
    });

    // Mock DOM container for stats
    let renderedHtml = '';
    controller.statsContainer = {
        set innerHTML(val) { renderedHtml = val; },
        get innerHTML() { return renderedHtml; }
    };

    // --- TEST 1: Stability of 7-day chart across different period tabs ---
    controller.setStatsPeriod('semana');
    const htmlSemana = renderedHtml;

    controller.setStatsPeriod('mes');
    const htmlMes = renderedHtml;

    controller.setStatsPeriod('hoje');
    const htmlHoje = renderedHtml;

    controller.setStatsPeriod('geral');
    const htmlGeral = renderedHtml;

    // Extract the 7-day chart section from each render
    const extract7DaysSection = (html) => {
        const startIdx = html.indexOf('Atividade nos Últimos 7 Dias');
        if (startIdx === -1) throw new Error("Seção 'Atividade nos Últimos 7 Dias' não encontrada!");
        return html.substring(startIdx);
    };

    const chartSemana = extract7DaysSection(htmlSemana);
    const chartMes = extract7DaysSection(htmlMes);
    const chartHoje = extract7DaysSection(htmlHoje);
    const chartGeral = extract7DaysSection(htmlGeral);

    if (chartSemana !== chartMes || chartSemana !== chartHoje || chartSemana !== chartGeral) {
        throw new Error("FALHA: O gráfico dos últimos 7 dias ainda muda quando se altera o filtro de período!");
    }
    console.log("✅ TESTE 1 PASSOU: Gráfico de 7 dias é perfeitamente estável e idêntico em todas as abas (Hoje, Semana, Mês, Geral).");

    // --- TEST 2: Verification of 7-day values (3m, 59m, 68m) and chronological ordering ---
    if (!chartSemana.includes('3m') || !chartSemana.includes('59m') || !chartSemana.includes('68m')) {
        throw new Error(`FALHA: Valores esperados de foco (3m, 59m, 68m) não estão no gráfico!`);
    }

    // Check chronological order: 3m (Thursday 6d ago) must appear BEFORE 59m (Friday 5d ago), which must appear BEFORE 68m (Tuesday yesterday)
    const idx3m = chartSemana.indexOf('3m');
    const idx59m = chartSemana.indexOf('59m');
    const idx68m = chartSemana.indexOf('68m');

    if (idx3m > idx59m || idx59m > idx68m) {
        throw new Error(`FALHA: Ordem cronológica incorreta no gráfico de 7 dias! idx3m: ${idx3m}, idx59m: ${idx59m}, idx68m: ${idx68m}`);
    }
    console.log("✅ TESTE 2 PASSOU: Valores (3m, 59m, 68m) estão presentes e ordenados em ordem cronológica estrita (passado -> hoje).");

    // --- TEST 3: Card 4 reflects session count of selected period ---
    controller.setStatsPeriod('semana');
    if (!renderedHtml.includes('Sessões (Esta Semana)')) {
        throw new Error("FALHA: Rótulo do Card 4 não reflete o período 'Esta Semana'");
    }
    // In 'semana' (Tuesday sessions: sess_4 and sess_5), there are 2 sessions
    if (!renderedHtml.includes('>2</p>') || !renderedHtml.includes('Sessões (Esta Semana)')) {
        throw new Error("FALHA: Card 4 deveria contabilizar 2 sessões para a semana corrente");
    }

    controller.setStatsPeriod('mes');
    if (!renderedHtml.includes('Sessões (Este Mês)')) {
        throw new Error("FALHA: Rótulo do Card 4 não reflete o período 'Este Mês'");
    }
    // In 'mes', all 5 sessions are from this month
    if (!renderedHtml.includes('>5</p>') || !renderedHtml.includes('Sessões (Este Mês)')) {
        throw new Error("FALHA: Card 4 deveria contabilizar 5 sessões para o mês corrente");
    }
    console.log("✅ TESTE 3 PASSOU: Card 4 contabiliza com precisão as sessões do período selecionado.");

    // --- TEST 4: Empty days have 0% height (no fake blue bar on empty days) ---
    // In our rolling 7 days, today and days -2, -3, -4 have 0 minutes studied
    if (!chartSemana.includes('style="height: 0%"')) {
        throw new Error("FALHA: Dias sem estudos deveriam ter altura 0%");
    }
    console.log("✅ TESTE 4 PASSOU: Dias com 0 minutos têm barra 0% sem artefatos ou traços indevidos.");

    console.log("\n🎉 TODOS OS TESTES DE MÉTRICAS DO POMODORO PASSARAM COM SUCESSO!");
}

runTests().catch(err => {
    console.error("❌ ERRO NO TESTE:", err.message);
    process.exit(1);
});
