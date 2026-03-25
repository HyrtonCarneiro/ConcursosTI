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
            tr.className = 'hover:bg-gray-50 transition-colors group';
            tr.innerHTML = `
                <td class="p-4 text-sm font-medium text-gray-900">${window.utils.formatDateBR(item.semana)}</td>
                <td class="p-4 text-sm text-gray-700">${materia ? materia.nome : '-'}</td>
                <td class="p-4 text-sm text-gray-700">${conteudo ? conteudo.nome : '-'}</td>
                <td class="p-4 text-sm font-semibold text-primary-600 text-center">${item.paginas}</td>
                <td class="p-4 text-sm text-center">
                    <button class="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all font-medium flex items-center gap-1 mx-auto" onclick="window.cronogramaController.removerItem('${item.id}')">
                        <i class="ph ph-trash"></i> Remover
                    </button>
                </td>
            `;
            this.tbody.appendChild(tr);
        });
    },

    removerItem: function(id) {
        if (confirm("Tem certeza que deseja remover este item?")) {
            window.store.removeCronogramaItem(id);
            window.utils.showToast("Item removido", "info");
            this.renderTable();
        }
    }
};
