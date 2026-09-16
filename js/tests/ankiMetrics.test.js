const fs = require('fs');
const path = require('path');

// Mock browser environment
global.localStorage = {
    data: {},
    getItem: function(k) { return this.data[k] || null; },
    setItem: function(k, v) { this.data[k] = String(v); },
    removeItem: function(k) { delete this.data[k]; }
};

global.window = {
    utils: { showToast: () => {} },
    localStorage: global.localStorage
};

// Load ankiApi.js
const apiCode = fs.readFileSync(path.join(__dirname, '../logic/ankiApi.js'), 'utf8');
eval(apiCode);
const ankiApi = window.ankiApi;

async function runTests() {
    console.log("Iniciando testes de validação das métricas do Anki...");

    // --- TEST 1: Sanitização de tags e hierarquias com cleanSubjectName ---
    console.log("Testando cleanSubjectName...");
    const testCases = [
        { input: 'BANCOS::DE::DADOS', expected: 'Bancos de Dados' },
        { input: 'bancos::de::dados', expected: 'Bancos de Dados' },
        { input: 'tecnologia::banco_de_dados', expected: 'Tecnologia Banco de Dados' },
        { input: 'direito-constitucional', expected: 'Direito Constitucional' },
        { input: 'redes_de_computadores', expected: 'Redes de Computadores' }
    ];

    testCases.forEach(({ input, expected }) => {
        const result = ankiApi.cleanSubjectName(input);
        if (result !== expected) {
            throw new Error(`cleanSubjectName falhou para "${input}": esperava "${expected}", obteve "${result}"`);
        }
    });
    console.log("✅ TESTE 1 PASSOU: cleanSubjectName formata corretamente tags hierárquicas e separadores.");

    // --- TEST 2: Consultas do Forecast (Previsão de Carga) ---
    console.log("Testando queries do Forecast...");
    const executedQueries = [];
    ankiApi.invoke = async function(action, version, params) {
        if (action === 'findCards') {
            executedQueries.push(params.query);
            return [];
        }
        return [];
    };

    await ankiApi.getWorkloadForecast(5);

    if (executedQueries[0] !== 'prop:due<=0') {
        throw new Error(`FALHA: Query do dia 0 (Hoje) deveria ser "prop:due<=0", mas foi "${executedQueries[0]}"`);
    }
    if (executedQueries[1] !== 'prop:due=1') {
        throw new Error(`FALHA: Query do dia 1 (Amanhã) deveria ser "prop:due=1", mas foi "${executedQueries[1]}"`);
    }
    if (executedQueries[2] !== 'prop:due=2') {
        throw new Error(`FALHA: Query do dia 2 deveria ser "prop:due=2", mas foi "${executedQueries[2]}"`);
    }
    console.log("✅ TESTE 2 PASSOU: Queries de Previsão de Carga corrigidas (Hoje: prop:due<=0, Amanhã: prop:due=1).");

    // --- TEST 3: Syllabus Data com exclusão de suspensos e limpeza de tags ---
    console.log("Testando getSyllabusData...");
    ankiApi.invoke = async function(action, version, params) {
        if (action === 'findCards') return [1, 2, 3, 4];
        return [];
    };
    ankiApi.invokeBatch = async function(action, version, ids, keyName) {
        if (action === 'cardsInfo') {
            return [
                { id: 1, note: 101, queue: 0, type: 0, ivl: 0, lapses: 0 }, // Novo
                { id: 2, note: 102, queue: 2, type: 2, ivl: 10, lapses: 2 }, // Jovem com 2 lapses
                { id: 3, note: 103, queue: 2, type: 2, ivl: 25, lapses: 1 }, // Maduro
                { id: 4, note: 104, queue: -1, type: 2, ivl: 5, lapses: 0 } // Suspenso (deve ser ignorado)
            ];
        }
        if (action === 'notesInfo') {
            return [
                { noteId: 101, tags: ['BANCOS::DE::DADOS'] },
                { noteId: 102, tags: ['bancos::de::dados'] },
                { noteId: 103, tags: ['Bancos::De::Dados'] },
                { noteId: 104, tags: ['bancos::de::dados'] }
            ];
        }
        return [];
    };

    const syllabus = await ankiApi.getSyllabusData();
    const bdStats = syllabus['Bancos de Dados'];

    if (!bdStats) {
        throw new Error(`FALHA: Matéria "Bancos de Dados" não encontrada no Syllabus! Chaves existentes: ${Object.keys(syllabus).join(', ')}`);
    }
    if (bdStats.total !== 3) {
        throw new Error(`FALHA: Total de cards ativos deveria ser 3 (ignorando suspenso), mas foi ${bdStats.total}`);
    }
    if (bdStats.new !== 1 || bdStats.young !== 1 || bdStats.mature !== 1) {
        throw new Error(`FALHA: Proporção incorreta no Syllabus: new=${bdStats.new}, young=${bdStats.young}, mature=${bdStats.mature}`);
    }
    if (bdStats.lapses !== 3) {
        throw new Error(`FALHA: Lapses acumulados deveriam ser 3 (2 do card 2 + 1 do card 3), mas foi ${bdStats.lapses}`);
    }
    console.log("✅ TESTE 3 PASSOU: Syllabus limpa tags hierárquicas, computa lapses vitálicios e ignora suspensos.");

    console.log("\n🎉 TODOS OS TESTES DE MÉTRICAS DO ANKI PASSARAM COM SUCESSO!");
}

runTests().catch(err => {
    console.error("❌ ERRO NO TESTE:", err.message);
    process.exit(1);
});
