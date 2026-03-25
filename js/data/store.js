// Simple state management (Zero-build pattern)
window.store = {
    state: {
        isAuthenticated: false,
        materias: [
            { id: 'm1', nome: 'Banco de Dados' },
            { id: 'm2', nome: 'Redes de Computadores' }
        ],
        conteudos: [
            { id: 'c1', materiaId: 'm1', nome: 'Modelagem ER' },
            { id: 'c2', materiaId: 'm1', nome: 'SQL Básico' }
        ],
        cronograma: [] // { id, semana, materiaId, conteudoId, paginas }
    },

    getState: function() {
        return this.state;
    },

    addMateria: function(nome) {
        if (!nome) throw new Error("Nome da matéria é obrigatório");
        const id = 'm' + Date.now();
        this.state.materias.push({ id, nome });
        return { id, nome };
    },

    addConteudo: function(materiaId, nome) {
        if (!materiaId || !nome) throw new Error("Matéria e nome do conteúdo são obrigatórios");
        const id = 'c' + Date.now();
        this.state.conteudos.push({ id, materiaId, nome });
        return { id, materiaId, nome };
    },

    getConteudosPorMateria: function(materiaId) {
        return this.state.conteudos.filter(c => c.materiaId === materiaId);
    },

    addCronogramaItem: function(semana, materiaId, conteudoId, paginas) {
        if (!semana || !materiaId || !conteudoId || !paginas) throw new Error("Todos os campos do cronograma são obrigatórios");
        const id = 'cron_' + Date.now() + Math.random().toString(16).slice(2);
        const item = { id, semana, materiaId, conteudoId, paginas: parseInt(paginas, 10) };
        this.state.cronograma.push(item);
        
        // Sort by semana ascending
        this.state.cronograma.sort((a,b) => a.semana.localeCompare(b.semana));
        return item;
    },
    
    removeCronogramaItem: function(id) {
        this.state.cronograma = this.state.cronograma.filter(i => i.id !== id);
    }
};
