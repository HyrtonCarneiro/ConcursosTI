// js/tests/studyMetricsChart.test.js
const assert = require('assert');
const logic = require('../logic/mentorLogic.js');

console.log("Iniciando testes de métricas de tempo de estudo e gráfico do dashboard...");

// 1. Teste de 7 dias com labels dos dias da semana
const mockState = {
    pomodoroSessoes: [
        {
            dataFim: new Date().toISOString(),
            tempoTotalFocoSeg: 3600, // 60 min
            categoria: 'Conteúdo Teórico',
            nota: 'Estudando Redes de Computadores'
        },
        {
            dataFim: new Date().toISOString(),
            tempoTotalFocoSeg: 1800, // 30 min
            categoria: 'Questões',
            nota: '20 questões resolvidas Cebraspe'
        }
    ]
};

const mockAnkiTime = {};
const hoje = new Date();
const yyyy = hoje.getFullYear();
const mm = String(hoje.getMonth() + 1).padStart(2, '0');
const dd = String(hoje.getDate()).padStart(2, '0');
const hojeKey = `${yyyy}-${mm}-${dd}`;
mockAnkiTime[hojeKey] = 1200000; // 20 min em ms

// Teste 7 dias
const met7d = logic.calculateStudyMetrics(mockState, mockAnkiTime, 7);
assert.strictEqual(met7d.dias.length, 7, "Deveria conter exatamente 7 dias");
const ultimoDia7d = met7d.dias[6];
assert.ok(ultimoDia7d.weekday, "Deveria ter nome do dia da semana");
assert.strictEqual(ultimoDia7d.label, ultimoDia7d.weekday, "No modo de 7 dias o label deve ser o dia da semana");
assert.strictEqual(ultimoDia7d.conteudoMin, 60, "Deveria registrar 60 min de conteúdo");
assert.strictEqual(ultimoDia7d.questoesMin, 30, "Deveria registrar 30 min de questões");
assert.strictEqual(ultimoDia7d.ankiMin, 20, "Deveria registrar 20 min de anki");
assert.strictEqual(ultimoDia7d.totalMin, 110, "Total do dia deveria ser 110 min");
assert.strictEqual(met7d.totalGeralMin, 110, "Total geral deveria ser 110 min");
assert.strictEqual(met7d.percConteudo, 55, "Percentual de conteúdo aproximado de 55%");
assert.strictEqual(met7d.percQuestoes, 27, "Percentual de questões aproximado de 27%");
assert.strictEqual(met7d.percAnki, 18, "Percentual de anki aproximado de 18%");
console.log("✅ TESTE 1 PASSOU: Métricas de 7 dias com labels dos dias da semana e separação correta dos 3 tipos de estudo.");

// Teste 30 dias
const met30d = logic.calculateStudyMetrics(mockState, mockAnkiTime, 30);
assert.strictEqual(met30d.dias.length, 30, "Deveria conter exatamente 30 dias");
const ultimoDia30d = met30d.dias[29];
assert.strictEqual(ultimoDia30d.label, `${dd}/${mm}`, "No modo de 30 dias o label deve ser DD/MM");
console.log("✅ TESTE 2 PASSOU: Métricas de 30 dias com labels em formato DD/MM (ex: 09/10).");

// Teste do Contexto do Estudante e IA Mentor
const ctx = logic.buildStudentContext(mockState, {
    success: true,
    count: 15,
    breakdown: { new: 5, learn: 5, review: 5 },
    dailyTimeList: [{ dateKey: hojeKey, timeMs: 1200000 }]
});

assert.ok(ctx.tempoGeralDeEstudo, "Contexto do mentor deve conter tempoGeralDeEstudo");
assert.ok(ctx.tempoGeralDeEstudo.ultimos7Dias, "Deve conter ultimos7Dias");
assert.ok(ctx.tempoGeralDeEstudo.ultimos30Dias, "Deve conter ultimos30Dias");
assert.ok(ctx.tempoGeralDeEstudo.diagnosticoEquilibrio, "Deve conter diagnóstico de equilíbrio");
assert.strictEqual(ctx.tempoGeralDeEstudo.ultimos7Dias.distribuicaoPercentual.anki, '18%');
assert.strictEqual(ctx.tempoGeralDeEstudo.ultimos7Dias.distribuicaoPercentual.pomodoroConteudo, '55%');
assert.strictEqual(ctx.tempoGeralDeEstudo.ultimos7Dias.distribuicaoPercentual.pomodoroQuestoes, '27%');
console.log("✅ TESTE 3 PASSOU: Mentor IA recebe estatísticas completas e consolidadas de tempo de estudo.");

console.log("\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO!");
