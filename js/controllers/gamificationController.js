window.gamificationController = {
    updateUI: function() {
        const stats = window.store.getState().estatisticas;
        const simulados = window.store.getState().simulados;
        
        const elStreak = document.getElementById('stat-streak');
        const elMedia = document.getElementById('stat-media-acertos');
        const elHoras = document.getElementById('stat-total-horas');
        const containerBadges = document.getElementById('container-badges');
        
        if (elStreak) elStreak.textContent = stats.streak + ' dias';
        
        if (elMedia) {
            if (simulados.length > 0) {
                const sum = simulados.reduce((acc, curr) => acc + curr.nota, 0);
                elMedia.textContent = Math.round(sum / simulados.length) + '%';
            } else {
                elMedia.textContent = '--';
            }
        }
        
        if (elHoras) elHoras.textContent = stats.totalHorasEstudo + 'h';

        this.renderBadges(containerBadges);
    },

    renderBadges: function(container) {
        if (!container) return;
        container.innerHTML = "";
        
        const badges = [
            { id: 'b1', icon: 'ph-fire', label: 'Primeiros Passos', active: true },
            { id: 'b2', icon: 'ph-trophy', label: 'Mestre SQL', active: window.store.getState().simulados.length > 5 },
            { id: 'b3', icon: 'ph-lightning', label: 'Foco Total', active: window.store.getState().estatisticas.streak >= 7 },
            { id: 'b4', icon: 'ph-book-open', label: 'Devorador de Livros', active: window.store.getState().estatisticas.totalPaginasLidas >= 500 },
        ];

        badges.forEach(b => {
            const div = document.createElement('div');
            div.className = 'flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ' + 
                            (b.active ? 'bg-white border-primary-200' : 'bg-gray-50 border-gray-100 opacity-30 grayscale');
            div.innerHTML = ' \
                <div class="w-12 h-12 rounded-full flex items-center justify-center ' + (b.active ? 'bg-primary-50 text-primary-600' : 'bg-gray-200 text-gray-400') + '"> \
                    <i class="ph ' + b.icon + ' text-2xl"></i> \
                </div> \
                <span class="text-[10px] font-bold text-center uppercase tracking-tight">' + b.label + '</span>';
            container.appendChild(div);
        });
    }
};
