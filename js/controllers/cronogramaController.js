window.cronogramaController = {
    init: function() {
        this.cacheDOM();
        this.bindEvents();
    },

    cacheDOM: function() {
        this.modal = document.getElementById('modal-cronograma');
        this.modalContent = document.getElementById('modal-cronograma-content');
        this.btnNovo = document.getElementById('btn-novo-cronograma');
        this.btnFechar = document.getElementById('btn-fechar-modal');
        this.btnCancelar = document.getElementById('btn-cancelar-modal');
        this.form = document.getElementById('form-item-cronograma');
        this.tbody = document.getElementById('tbody-cronograma');
        this.selectMateria = document.getElementById('select-cronograma-materia');
        this.containerConteudos = document.getElementById('container-conteudos-checkboxes');
    },

    bindEvents: function() {
        if (!this.btnNovo) return;

        this.btnNovo.addEventListener('click', () => this.openModal());
        this.btnFechar.addEventListener('click', () => this.closeModal());
        this.btnCancelar.addEventListener('click', () => this.closeModal());
        
        // Mudar matéria no modal
        this.selectMateria.addEventListener('change', (e) => {
            this.renderConteudosCheckboxes(e.target.value);
        });

        // Submit form
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave();
        });
    },

    openModal: function() {
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
        
        // Populate Materias
        this.selectMateria.innerHTML = '<option value="" disabled selected>Selecione uma matéria</option>';
        window.store.getState().materias.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.nome;
            this.selectMateria.appendChild(opt);
        });

        requestAnimationFrame(() => {
            this.modal.classList.remove('bg-gray-900/0');
            this.modalContent.classList.remove('scale-95', 'opacity-0');
        });
    },

    closeModal: function() {
        this.modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.modal.classList.remove('flex');
            this.form.reset();
            this.containerConteudos.innerHTML = '<span class="text-sm text-gray-400 italic">Selecione a matéria primeiro...</span>';
        }, 200);
    },

    renderConteudosCheckboxes: function(materiaId) {
        const conteudos = window.store.getConteudosPorMateria(materiaId);
        this.containerConteudos.innerHTML = '';
        
        if (conteudos.length === 0) {
            this.containerConteudos.innerHTML = '<span class="text-sm text-gray-500">Nenhum conteúdo cadastrado para esta matéria.</span>';
            return;
        }

        conteudos.forEach(c => {
            const label = document.createElement('label');
            label.className = 'flex items-center gap-2 cursor-pointer bg-white p-2 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors';
            label.innerHTML = `
                <input type="checkbox" name="conteudoCheckbox" value="${c.id}" class="rounded text-primary-600 focus:ring-primary-500 w-4 h-4">
                <span class="text-sm text-gray-700 font-medium">${c.nome}</span>
            `;
            this.containerConteudos.appendChild(label);
        });
    },

    handleSave: function() {
        const dateInput = document.getElementById('input-cronograma-semana').value;
        const materiaId = this.selectMateria.value;
        const checkboxes = document.querySelectorAll('input[name="conteudoCheckbox"]:checked');
        const conteudosList = Array.from(checkboxes).map(cb => cb.value);
        const paginas = document.getElementById('input-cronograma-paginas').value;

        try {
            const semana = window.utils.getWeekMonday(dateInput);
            window.cronogramaLogic.validateItem(semana, materiaId, conteudosList, paginas);
            
            // Salvar para cada conteudo selecionado
            conteudosList.forEach(conteudoId => {
                window.store.addCronogramaItem(semana, materiaId, conteudoId, paginas);
            });
            
            window.utils.showToast("Estudo(s) adicionado(s) com sucesso", "success");
            this.closeModal();
            this.renderTable();
        } catch(e) {
            window.utils.showToast("Erro ao salvar: " + e.message, "error");
        }
    },

    renderTable: function() {
        if (!this.tbody) return;
        this.tbody.innerHTML = '';
        
        const itens = window.store.getState().cronograma;
        if (itens.length === 0) {
            this.tbody.innerHTML = `<tr><td colspan="5" class="text-center p-8 text-gray-500">Nenhum estudo no cronograma.</td></tr>`;
            return;
        }

        itens.forEach(item => {
            const materia = window.store.getState().materias.find(m => m.id === item.materiaId);
            const conteudo = window.store.getState().conteudos.find(c => c.id === item.conteudoId);
            
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50 transition-colors group ' + (item.concluido ? 'opacity-60 bg-gray-50' : '');
            
            const contentHTML = ' \
                <td class="p-4 text-sm font-medium text-gray-900">' + window.utils.formatDateBR(item.semana) + '</td> \
                <td class="p-4 text-sm text-gray-700">' + (materia ? materia.nome : '-') + '</td> \
                <td class="p-4 text-sm text-gray-700"> \
                    <div class="flex flex-col"> \
                        <span class="' + (item.concluido ? 'line-through text-gray-400' : 'font-medium') + '">' + (conteudo ? conteudo.nome : '-') + '</span> \
                        <button onclick="window.cronogramaController.goMaterial(\'' + item.conteudoId + '\')" class="text-xs text-primary-500 hover:underline flex items-center gap-1 mt-1"> \
                            <i class="ph ph-notebook"></i> Notas/Links \
                        </button> \
                    </div> \
                </td> \
                <td class="p-4 text-sm font-semibold text-primary-600 text-center">' + item.paginas + '</td> \
                <td class="p-4 text-sm"> \
                    <div class="flex items-center justify-center gap-3"> \
                        <button onclick="window.cronogramaController.toggleConcluido(\'' + item.id + '\')" class="w-8 h-8 rounded-full border-2 ' + (item.concluido ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 text-transparent hover:border-green-500') + ' flex items-center justify-center transition-all"> \
                            <i class="ph ph-check-bold scale-75"></i> \
                        </button> \
                        <button onclick="window.cronogramaController.startFocus(\'' + item.id + '\')" class="w-8 h-8 rounded-xl bg-primary-100 text-primary-600 hover:bg-primary-600 hover:text-white flex items-center justify-center transition-all" title="Iniciar Pomodoro"> \
                            <i class="ph ph-timer"></i> \
                        </button> \
                        <button class="w-8 h-8 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100" onclick="window.cronogramaController.removerItem(\'' + item.id + '\')" title="Remover"> \
                            <i class="ph ph-trash"></i> \
                        </button> \
                    </div> \
                </td>';
            
            tr.innerHTML = contentHTML;
            this.tbody.appendChild(tr);
        });
    },

    toggleConcluido: function(id) {
        try {
            const item = window.store.getState().cronograma.find(i => i.id === id);
            if (item.concluido) {
                item.concluido = false;
                item.dataConclusao = null;
                // Note: reverting stats is complex, leaving for now as user just asked to mark.
            } else {
                window.store.concluirItemCronograma(id);
                window.spacedRepetition.gerarRevisoesParaConteudo(item.conteudoId, item.dataConclusao);
                window.utils.showToast("Estudo concluído! Revisões agendadas.", "success");
            }
            this.renderTable();
        } catch (e) {
            window.utils.showToast("Erro: " + e.message, "error");
        }
    },

    startFocus: function(id) {
        const item = window.store.getState().cronograma.find(i => i.id === id);
        const materia = window.store.getState().materias.find(m => m.id === item.materiaId);
        const conteudo = window.store.getState().conteudos.find(c => c.id === item.conteudoId);
        
        if (window.pomodoroController) {
            window.pomodoroController.openWithContext(materia.nome + ": " + conteudo.nome);
        }
    },

    goMaterial: function(conteudoId) {
        window.appControllers.navigate('materiais');
        if (window.materialController) {
            window.materialController.focusOn(conteudoId);
        }
    },

    removerItem: function(id) {
        if (confirm("Tem certeza que deseja remover este item?")) {
            window.store.removeCronogramaItem(id);
            window.utils.showToast("Item removido", "info");
            this.renderTable();
        }
    }
};
