window.materialController = {
    init: function() {
        this.container = document.getElementById('container-materiais');
        this.searchInput = document.getElementById('input-search-materiais');
        
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.render());
        }
    },

    render: function() {
        if (!this.container) return;
        const state = window.store.getState();
        const search = this.searchInput ? this.searchInput.value.toLowerCase() : "";
        
        this.container.innerHTML = "";
        
        state.conteudos.forEach(c => {
            if (search && !c.nome.toLowerCase().includes(search)) return;
            
            const materia = state.materias.find(m => m.id === c.materiaId);
            const material = window.store.getMaterial(c.id);
            
            const card = document.createElement('div');
            card.className = 'bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-primary-300 transition-all';
            card.id = 'mat-card-' + c.id;
            
            card.innerHTML = ' \
                <div class="flex flex-col gap-4"> \
                    <div> \
                        <span class="text-[10px] font-bold uppercase tracking-widest text-primary-500">' + (materia ? materia.nome : 'Sem Matéria') + '</span> \
                        <h3 class="font-bold text-gray-800">' + c.nome + '</h3> \
                    </div> \
                    <div> \
                        <label class="block text-xs font-semibold text-gray-400 mb-2 uppercase">Links Úteis</label> \
                        <div class="flex flex-wrap gap-2 mb-3" id="links-' + c.id + '"> \
                            ' + this.renderLinks(material.links) + ' \
                            <button onclick="window.materialController.addLink(\'' + c.id + '\')" class="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-primary-50 hover:text-primary-600 flex items-center justify-center transition-all"> \
                                <i class="ph ph-plus text-sm"></i> \
                            </button> \
                        </div> \
                        <label class="block text-xs font-semibold text-gray-400 mb-1 uppercase">Anotações</label> \
                        <textarea class="w-full text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border-none focus:ring-2 focus:ring-primary-500 min-h-[100px]" \
                                  placeholder="Suas notas aqui..." \
                                  onblur="window.materialController.saveNotes(\'' + c.id + '\', this.value)">' + material.notas + '</textarea> \
                    </div> \
                </div>';
            
            this.container.appendChild(card);
        });
    },

    renderLinks: function(links) {
        if (!links || links.length === 0) return "";
        return links.map(link => ' \
            <a href="' + link + '" target="_blank" class="px-3 py-1 bg-primary-50 text-primary-600 text-xs font-medium rounded-full hover:bg-primary-100 transition-colors flex items-center gap-1"> \
                <i class="ph ph-link"></i> Link \
            </a>').join("");
    },

    addLink: function(conteudoId) {
        const url = prompt("Insira a URL do material (PDF, Vídeo, etc):");
        if (url) {
            const material = window.store.getMaterial(conteudoId);
            material.links.push(url);
            window.store.updateMaterial(conteudoId, material.links, material.notas);
            this.render();
            window.utils.showToast("Link adicionado!", "success");
        }
    },

    saveNotes: function(conteudoId, value) {
        const material = window.store.getMaterial(conteudoId);
        if (material.notas === value) return;
        window.store.updateMaterial(conteudoId, material.links, value);
        window.utils.showToast("Anotações salvas.", "info");
    },

    focusOn: function(conteudoId) {
        setTimeout(() => {
            const el = document.getElementById('mat-card-' + conteudoId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-2', 'ring-primary-500');
                setTimeout(() => el.classList.remove('ring-2', 'ring-primary-500'), 3000);
            }
        }, 100);
    }
};
