// Mocking window objects for Node environment
global.window = {
    store: {
        getState: () => ({ revisoes: [] })
    }
};

const fs = require('fs');
const path = require('path');
const code = fs.readFileSync(path.join(__dirname, '../logic/spacedRepetition.js'), 'utf8');
eval(code.replace('window.', 'global.'));

function test() {
    console.log("Running Spaced Repetition Tests...");
    
    // Test base calculation
    const dataBase = "2026-03-25T10:00:00.000Z";
    const revisoes = global.spacedRepetition.calcularProximasRevisoes(dataBase);
    
    if (revisoes.length !== 4) throw new Error("Should generate 4 revisions");
    
    const d1 = new Date(revisoes[0]);
    if (d1.getDate() !== 26) throw new Error("1st revision should be +1 day");
    
    const d4 = new Date(revisoes[3]);
    if (d4.getMonth() !== 5) throw new Error("4th revision should be +90 days (approx June)");

    console.log("✅ All Spaced Repetition tests passed!");
}

try {
    test();
} catch (e) {
    console.error("❌ Test failed:", e.message);
    process.exit(1);
}
