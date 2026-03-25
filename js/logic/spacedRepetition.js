window.spacedRepetition = {
    calcularProximasRevisoes: function(dataBaseStr) {
        if (!dataBaseStr) return [];
        
        const dataBase = new Date(dataBaseStr);
        const intervalos = [1, 7, 30, 90];
        
        return intervalos.map(dias => {
            const dataRevisao = new Date(dataBase);
            dataRevisao.setDate(dataRevisao.getDate() + dias);
            return dataRevisao.toISOString();
        });
    },

    gerarRevisoesParaConteudo: function(conteudoId, dataConclusao) {
        const datas = this.calcularProximasRevisoes(dataConclusao);
        const state = window.store.getState();
        
        datas.forEach(data => {
            const id = 'rev_' + Date.now() + Math.random().toString(16).slice(2);
            state.revisoes.push({
                id,
                conteudoId,
                dataRevisao: data,
                status: 'pendente'
            });
        });
    },

    getRevisoesParaHoje: function() {
        const hoje = new Date().toISOString().split('T')[0];
        const state = window.store.getState();
        
        return state.revisoes.filter(rev => {
            const dataRev = rev.dataRevisao.split('T')[0];
            return dataRev <= hoje && rev.status === 'pendente';
        });
    }
};
