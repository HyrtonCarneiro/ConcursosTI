window.cronogramaLogic = {
    isValidWeek: function(dateString) {
        if (!dateString) return false;
        return true;
    },
    
    validateItem: function(semana, materiaId, conteudosList, paginas) {
        if (!this.isValidWeek(semana)) throw new Error("Semana inválida");
        if (!materiaId) throw new Error("Selecione uma matéria");
        if (!conteudosList || conteudosList.length === 0) throw new Error("Selecione no mínimo um conteúdo");
        if (!paginas || parseInt(paginas, 10) < 1) throw new Error("O número de páginas é obrigatório (mínimo 1)");
    }
};
