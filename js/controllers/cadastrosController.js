window.cadastrosController = {
    init: function() {
        this.cacheDOM();
        this.bindEvents();
        this.renderMateriasSelect();
    },

    cacheDOM: function() {
        this.formMateria = document.getElementById('form-materia');
        this.formConteudo = document.getElementById('form-conteudo');
        this.inputMateriaNome = document.getElementById('input-materia-nome');
        this.inputConteudoNome = document.getElementById('input-conteudo-nome');
        this.selectMateria = document.getElementById('select-materia');
    },

    bindEvents: function() {
        if (this.formMateria) {
            this.formMateria.addEventListener('submit', (e) => {
                e.preventDefault();
                try {
                    window.store.addMateria(this.inputMateriaNome.value.trim());
                    window.utils.showToast("Matéria salva com sucesso!", "success");
                    this.inputMateriaNome.value = '';
                    this.renderMateriasSelect();
                } catch(e) {
                    window.utils.showToast("Erro ao salvar: " + e.message, "error");
                }
            });
        }

        if (this.formConteudo) {
            this.formConteudo.addEventListener('submit', (e) => {
                e.preventDefault();
                try {
                    window.store.addConteudo(this.selectMateria.value, this.inputConteudoNome.value.trim());
                    window.utils.showToast("Conteúdo salvo com sucesso!", "success");
                    this.inputConteudoNome.value = '';
                } catch(e) {
                    window.utils.showToast("Erro ao salvar: " + e.message, "error");
                }
            });
        }
    },

    renderMateriasSelect: function() {
        if (!this.selectMateria) return;
        const materias = window.store.getState().materias;
        
        let html = '<option value="" disabled selected>Selecione uma matéria</option>';
        materias.forEach(m => {
            html += `<option value="${m.id}">${m.nome}</option>`;
        });
        
        this.selectMateria.innerHTML = html;
        
        // Populate the cronograma modal select as well if exists
        const selectCronograma = document.getElementById('select-cronograma-materia');
        if (selectCronograma) {
            let htmlCron = '<option value="" disabled selected>Selecione uma matéria</option>';
            materias.forEach(m => {
                htmlCron += `<option value="${m.id}">${m.nome}</option>`;
            });
            selectCronograma.innerHTML = htmlCron;
        }
    }
};
