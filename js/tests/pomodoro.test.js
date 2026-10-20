const fs = require('fs');
const path = require('path');

// Mock window and browser environment
global.window = {
    addEventListener: () => {},
    utils: {
        showToast: (msg) => console.log("TOAST:", msg)
    },
    store: {
        getState: () => ({ pomodoroConfig: null, pomodoroCategorias: [], pomodoroSessoes: [], materias: [] }),
        updatePomodoroConfig: () => {},
        addPomodoroSessao: (s) => s,
        save: () => {}
    }
};
global.document = {
    title: '',
    addEventListener: () => {},
    visibilityState: 'visible'
};
global.localStorage = {
    data: {},
    getItem: function(k) { return this.data[k] || null; },
    setItem: function(k, v) { this.data[k] = String(v); },
    removeItem: function(k) { delete this.data[k]; }
};

// Load pomodoro.js
const pomodoroCode = fs.readFileSync(path.join(__dirname, '../logic/pomodoro.js'), 'utf8');
eval(pomodoroCode);
const logic = window.pomodoroLogic;

async function runTests() {
    console.log("Running Pomodoro Logic Tests...");

    // Test 1: AutoStart = false -> Phase complete should stage 5:00 break, NOT pre-drain timer
    logic.initSession(4, { duracaoFoco: 25, pausaCurta: 5, autoStart: false }, { categoria: 'Test' });
    logic.startNextPhase(); // Starts focus (25 min)

    if (logic.mode !== 'focus') throw new Error(`Mode deveria ser 'focus', mas é ${logic.mode}`);
    if (logic.timeLeft !== 25 * 60) throw new Error(`TimeLeft inicial do foco deveria ser 1500s, mas é ${logic.timeLeft}`);
    if (!logic.isActive) throw new Error(`Foco deveria estar ativo`);

    // Simulate focus phase completion
    logic.timeLeft = 0;
    logic._phaseComplete();

    // Mode should now be 'shortBreak'
    if (logic.mode !== 'shortBreak') throw new Error(`Mode após foco deveria ser 'shortBreak', mas é ${logic.mode}`);
    if (logic.totalTime !== 5 * 60) throw new Error(`TotalTime da pausa curta deveria ser 300s, mas é ${logic.totalTime}`);
    if (logic.timeLeft !== 5 * 60) throw new Error(`TimeLeft da pausa curta deveria ser 300s (05:00), mas é ${logic.timeLeft}`);

    // Since autoStart is false, timer must NOT be running
    if (logic.isActive) throw new Error(`Com autoStart=false, a pausa curta NÃO deve estar ativa automaticamente`);
    
    // Simulate real time passing (e.g. 20 seconds pass before user clicks start)
    const originalDateNow = Date.now;
    let mockTime = originalDateNow();
    Date.now = () => mockTime;

    // Advance 20 seconds in the real world
    mockTime += 20 * 1000;

    // Check if visibility change or focus tick leaks the 20 seconds into unstarted break
    if (logic._checkTimestampTick) logic._checkTimestampTick();
    if (logic.timeLeft !== 300) {
        throw new Error(`ERRO: Tempo da pausa vazou antes de iniciar! Era 300s e virou ${logic.timeLeft}s (${logic.formatTime(logic.timeLeft)})`);
    }

    // Now the user clicks "Start" on the short break
    if (typeof logic.startCurrentPhase === 'function') {
        logic.startCurrentPhase();
    } else {
        // Legacy fallback
        logic.isActive = true;
        logic.isPaused = false;
        logic._startInterval();
    }

    if (!logic.isActive) throw new Error(`Após iniciar a pausa, isActive deve ser true`);
    if (logic.timeLeft !== 300) {
        throw new Error(`ERRO DO USUÁRIO REPRODUZIDO: Pausa curta iniciou em ${logic.formatTime(logic.timeLeft)} (${logic.timeLeft}s) em vez de 05:00 (300s)!`);
    }

    // Advance 1 second and check tick
    mockTime += 1000;
    if (logic._checkTimestampTick) logic._checkTimestampTick();
    if (logic.timeLeft !== 299) {
        throw new Error(`Após 1 segundo de pausa, deveria estar em 299s (04:59), mas está em ${logic.timeLeft}s`);
    }

    // Test 2: Break finishes -> Focus 2 should be staged at full 25:00 and wait for user start
    logic.timeLeft = 0;
    logic._phaseComplete();

    if (logic.mode !== 'focus') throw new Error(`Mode após pausa deveria ser 'focus', mas é ${logic.mode}`);
    if (logic.currentPomodoro !== 2) throw new Error(`Pomodoro atual deveria ser 2, mas é ${logic.currentPomodoro}`);
    if (logic.timeLeft !== 25 * 60) throw new Error(`TimeLeft do foco 2 deveria ser 1500s (25:00), mas é ${logic.timeLeft}`);
    if (logic.isActive) throw new Error(`Com autoStart=false, o foco 2 NÃO deve estar ativo automaticamente`);

    // Advance 30 seconds while user prepares
    mockTime += 30 * 1000;
    if (logic._checkTimestampTick) logic._checkTimestampTick();
    if (logic.timeLeft !== 25 * 60) {
        throw new Error(`Tempo do foco 2 vazou antes de iniciar! Era 1500s e virou ${logic.timeLeft}s`);
    }

    // Start Focus 2
    logic.startCurrentPhase();
    if (logic.timeLeft !== 25 * 60) {
        throw new Error(`Foco 2 iniciou em ${logic.formatTime(logic.timeLeft)} em vez de 25:00!`);
    }

    // Test 3: Pause and Resume mid-session
    mockTime += 10 * 1000; // 10s elapsed
    if (logic._checkTimestampTick) logic._checkTimestampTick();
    if (logic.timeLeft !== 1490) throw new Error(`Deveria ter 1490s restantes, tem ${logic.timeLeft}s`);

    logic.pause();
    if (!logic.isPaused || logic.isActive) throw new Error(`Deveria estar pausado`);

    // Wait 60 seconds while paused
    mockTime += 60 * 1000;
    if (logic._checkTimestampTick) logic._checkTimestampTick();
    if (logic.timeLeft !== 1490) throw new Error(`Tempo pausado não deveria diminuir!`);

    logic.resume();
    if (logic.isPaused || !logic.isActive) throw new Error(`Deveria ter resumido`);
    if (logic.timeLeft !== 1490) throw new Error(`Tempo após resume deveria continuar em 1490s`);

    // Test 4: Skip with autoStart = false
    logic.skip();
    if (logic.mode !== 'shortBreak') throw new Error(`Após pular foco 2, deveria estar em shortBreak`);
    if (logic.isActive) throw new Error(`Com autoStart=false, pular deve aguardar início`);
    if (logic.timeLeft !== 5 * 60) throw new Error(`Pausa após pular deve ter 300s`);

    // Test 5: Verify uniform break time across multiple cycles (no long break)
    logic.stop();
    logic.initSession(4, { duracaoFoco: 25, pausaCurta: 5, pausaLonga: 20, pomodorosAtePausaLonga: 2 }, { categoria: 'Test' });
    
    // Cycle 1: Foco 1
    logic.startNextPhase();
    if (logic.mode !== 'focus') throw new Error(`Ciclo 1 deveria iniciar em foco`);
    logic.timeLeft = 0;
    logic._phaseComplete(); // Completes pomo 1 -> Break 1
    if (logic.mode !== 'shortBreak') throw new Error(`Pausa 1 deveria ser break`);
    if (logic.totalTime !== 5 * 60) throw new Error(`Pausa 1 deveria ter 300s (5min), mas tem ${logic.totalTime}s`);
    if (logic.getModeLabel() !== 'Pausa') throw new Error(`getModeLabel deveria retornar 'Pausa', retornou ${logic.getModeLabel()}`);

    // Cycle 2: Foco 2
    logic.startNextPhase();
    if (logic.mode !== 'focus') throw new Error(`Ciclo 2 deveria ser foco`);
    logic.timeLeft = 0;
    logic._phaseComplete(); // Completes pomo 2 (which previously would trigger longBreak)
    if (logic.mode !== 'shortBreak') throw new Error(`Após pomo 2 (ponto de corte antigo de pausa longa), modo deveria continuar sendo pausa padrão ('shortBreak'), mas é ${logic.mode}`);
    if (logic.totalTime !== 5 * 60) throw new Error(`Após pomo 2, duração da pausa DEVE ser 5 min (300s), mas foi ${logic.totalTime}s! Pausa longa foi indevidamente acionada.`);
    if (logic.getModeLabel() !== 'Pausa') throw new Error(`getModeLabel após pomo 2 deveria ser 'Pausa', retornou ${logic.getModeLabel()}`);

    // Test 6: Restart current timer during focus
    logic.stop();
    logic.initSession(4, { duracaoFoco: 25, pausaCurta: 5, autoStart: false }, { categoria: 'Test' });
    logic.startNextPhase(); // Starts focus (25:00 = 1500s)
    
    // Simulate 300s (5 minutes) elapsed
    logic.timeLeft = 1200;
    logic.totalFocusSeconds = 300;
    
    logic.restartCurrentPhase();
    if (logic.timeLeft !== 25 * 60) throw new Error(`Após reiniciar foco, timeLeft deveria ser 1500s (25:00), mas é ${logic.timeLeft}s`);
    if (logic.isActive) throw new Error(`Após reiniciar foco, timer não deve estar rodando automaticamente`);
    if (logic.totalFocusSeconds !== 0) throw new Error(`Após reiniciar foco, tempo decorrido da tentativa deve ser descartado (0s), mas é ${logic.totalFocusSeconds}s`);

    // Test 7: Restart current timer during break
    logic.stop();
    logic.initSession(4, { duracaoFoco: 25, pausaCurta: 5, autoStart: false }, { categoria: 'Test' });
    logic.startNextPhase(); // Start focus
    logic.timeLeft = 0;
    logic._phaseComplete(); // Completes focus -> enters short break (300s)
    if (logic.mode !== 'shortBreak') throw new Error(`Mode deveria ser shortBreak, mas é ${logic.mode}`);
    logic.startCurrentPhase(); // Start break countdown
    logic.timeLeft = 180; // 2 minutes elapsed

    logic.restartCurrentPhase();
    if (logic.timeLeft !== 5 * 60) throw new Error(`Após reiniciar pausa, timeLeft deveria ser 300s (05:00), mas é ${logic.timeLeft}s`);
    if (logic.isActive) throw new Error(`Após reiniciar pausa, timer deve aguardar clique de início`);

    // Test 8: Cancel current pomodoro when pomodorosCompleted === 0 (full reset)
    logic.stop();
    logic.initSession(4, { duracaoFoco: 25, pausaCurta: 5 }, { categoria: 'Test' });
    logic.startNextPhase();
    logic.timeLeft = 1000;
    logic.totalFocusSeconds = 500;

    const cancelResult1 = logic.cancelCurrentPomodoro();
    if (!cancelResult1.sessionReset) throw new Error(`Cancelar no 1º pomodoro deveria resetar a sessão completamente`);
    if (logic.mode !== 'idle') throw new Error(`Após cancelar 1º pomodoro, modo deve ser 'idle'`);
    if (logic.totalFocusSeconds !== 0) throw new Error(`Após cancelar 1º pomodoro, totalFocusSeconds deve ser 0`);

    // Test 9: Cancel current pomodoro when pomodorosCompleted > 0 (partial retention)
    logic.stop();
    logic.initSession(4, { duracaoFoco: 25, pausaCurta: 5 }, { categoria: 'Test' });
    logic.startNextPhase();
    logic.timeLeft = 0;
    logic._phaseComplete(); // Completes pomo 1 (25 min = 1500s focus recorded)

    if (logic.pomodorosCompleted !== 1) throw new Error(`Deveria ter 1 pomodoro concluído`);
    if (logic.totalFocusSeconds !== 1500) throw new Error(`totalFocusSeconds deveria ser 1500s`);

    // Start pomo 2
    logic.startNextPhase(); // mode is now focus, pomo 2
    logic.timeLeft = 1200; // 300s into pomo 2
    logic.totalFocusSeconds = 1800; // 1500 + 300

    const cancelResult2 = logic.cancelCurrentPomodoro();
    if (cancelResult2.sessionReset) throw new Error(`Cancelar pomodoro 2 NÃO deve resetar os pomodoros já concluídos anteriormente`);
    if (cancelResult2.pomodorosCompleted !== 1) throw new Error(`Deveria manter 1 pomodoro concluído`);
    if (logic.totalFocusSeconds !== 1500) throw new Error(`Após cancelar pomo 2, totalFocusSeconds deve voltar para 1500s (descartando os 300s do pomo 2), mas é ${logic.totalFocusSeconds}s`);
    if (logic.currentSessionLogs.length !== 1) throw new Error(`Logs devem conter apenas o 1º pomodoro`);

    // Restore Date.now and stop timer
    logic.stop();
    Date.now = originalDateNow;

    console.log("✅ Testes de Pomodoro Logic passaram com sucesso em todos os cenários!");
}

runTests().catch(e => {
    console.error("❌ Teste falhou:", e.message);
    process.exit(1);
});
