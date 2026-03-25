window.cronogramaLogic = {
    isValidWeek: function(dateString) {
        if (!dateString) return false;
        return true;
    },
    
    validateItem: function(semana, materiaId, conteudosList) {
        if (!this.isValidWeek(semana)) throw new Error("Semana inválida");
        if (!materiaId) throw new Error("Selecione uma matéria");
        if (!conteudosList || conteudosList.length === 0) throw new Error("Selecione no mínimo um conteúdo");
    }
};
