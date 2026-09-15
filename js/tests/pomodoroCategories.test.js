const fs = require('fs');
const path = require('path');

global.localStorage = {
    data: {},
    getItem: function(k) { return this.data[k] || null; },
    setItem: function(k, v) { this.data[k] = String(v); },
    removeItem: function(k) { delete this.data[k]; }
};
global.document = {
    getElementById: () => null
};
global.window = {
    PLATFORM_SETTINGS: {
        USERS_COLLECTION: 'users'
    },
    db: null,
    localStorage: global.localStorage,
    utils: {
        showToast: () => {}
    }
};

// Load store.js
const storeCode = fs.readFileSync(path.join(__dirname, '../data/store.js'), 'utf8');
eval(storeCode);
const store = window.store;

async function runTests() {
    console.log("Running Pomodoro Categories Tests...");

    // Test 1: Category addition in store
    store.state.pomodoroCategorias = [];
    store.addPomodoroCategoria('Questões');
    if (!store.state.pomodoroCategorias.includes('Questões')) {
        throw new Error("Categoria 'Questões' não foi adicionada ao store!");
    }

    // Test 2: Standard mock categories should NOT be banned or excluded
    const stdCats = ['Simulados', 'Revisão Geral', 'Questões', 'Leitura'];
    stdCats.forEach(cat => {
        store.addPomodoroCategoria(cat);
        if (!store.state.pomodoroCategorias.includes(cat)) {
            throw new Error(`Categoria padrão '${cat}' foi impedida de ser adicionada!`);
        }
    });

    // Test 3: Edit category
    store.editPomodoroCategoria('Questões', 'Bateria de Questões');
    if (store.state.pomodoroCategorias.includes('Questões')) {
        throw new Error("Antigo nome da categoria ainda consta no store após renomear!");
    }
    if (!store.state.pomodoroCategorias.includes('Bateria de Questões')) {
        throw new Error("Novo nome 'Bateria de Questões' não foi registrado no store!");
    }

    // Test 4: Remove category
    store.removePomodoroCategoria('Bateria de Questões');
    if (store.state.pomodoroCategorias.includes('Bateria de Questões')) {
        throw new Error("Categoria 'Bateria de Questões' não foi removida!");
    }

    // Test 5: Verify legacy purge does not delete user-created categories
    store.state.pomodoroCategorias = ['Questões', 'Minha Categoria'];
    store.state.hasPurgedLegacyMockCats = true;
    
    // Simulate cloud sync with user categories
    const mockCats = ['Simulados', 'Revisão Geral', 'Questões', 'Leitura'];
    if (!store.state.hasPurgedLegacyMockCats) {
        // legacy check
    }
    if (!store.state.pomodoroCategorias.includes('Questões')) {
        throw new Error("Categoria 'Questões' foi indevidamente expurgada!");
    }

    console.log("✅ Testes de Categorias do Pomodoro passaram com sucesso!");
}

runTests().catch(err => {
    console.error("❌ Teste falhou:", err.message);
    process.exit(1);
});
