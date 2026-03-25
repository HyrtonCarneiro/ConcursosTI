window.dashboardController = {
    chart: null,
    
    update: function() {
        const state = window.store.getState();
        
        // Update KPI Cards
        this.updateKPIs(state);
        
        // Update "Revisar Hoje" section
        this.renderRevisoes(state);
        
        // Render Charts
        this.renderCharts(state);
    },

    updateKPIs: function(state) {
        document.getElementById('dash-total-materias').textContent = state.materias.length;
        document.getElementById('dash-total-conteudos').textContent = state.cronograma.length;
        document.getElementById('dash-total-paginas').textContent = state.estatisticas.totalPaginasLidas;
    },

    renderRevisoes: function(state) {
        const container = document.querySelector('#page-dashboard .bg-white.p-8.rounded-2xl');
        if (!container) return;
        
        const revisoesHoje = window.spacedRepetition.getRevisoesParaHoje();
        
        let html = '<h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2"><i class="ph ph-calendar-check text-primary-600"></i> Revisões para Hoje</h3>';
        
        if (revisoesHoje.length === 0) {
            html += '<p class="text-gray-600">Nenhuma revisão pendente para hoje. Bom trabalho!</p>';
        } else {
            html += '<div class="flex flex-col gap-2">';
            revisoesHoje.forEach(rev => {
                const conteudo = state.conteudos.find(c => c.id === rev.conteudoId);
                const materia = state.materias.find(m => m.id === (conteudo ? conteudo.materiaId : ''));
                html += ' \
                    <div class="flex items-center justify-between p-3 bg-primary-50 rounded-xl border border-primary-100"> \
                        <div> \
                            <p class="text-sm font-bold text-gray-800">' + (conteudo ? conteudo.nome : 'Desconhecido') + '</p> \
                            <p class="text-xs text-gray-500">' + (materia ? materia.nome : '-') + '</p> \
                        </div> \
                        <button onclick="window.dashboardController.concluirRevisao(\'' + rev.id + '\')" class="bg-white text-primary-600 px-3 py-1 rounded-lg text-xs font-bold shadow-sm hover:bg-primary-600 hover:text-white transition-all">CONCLUÍDO</button> \
                    </div>';
            });
            html += '</div>';
        }
        
        container.innerHTML = html;
    },

    concluirRevisao: function(id) {
        const rev = window.store.getState().revisoes.find(r => r.id === id);
        if (rev) {
            rev.status = 'concluido';
            window.utils.showToast("Revisão concluída!", "success");
            this.update();
        }
    },

    renderCharts: function(state) {
        // We'll replace the text content part with a chart container if needed, 
        // but for now let's just make sure we have a canvas for it in HTML or inject it.
        // Let's add the canvas to the Dashboard if it doesn't exist.
        let canvas = document.getElementById('chart-dashboard-distrib');
        if (!canvas) {
            const container = document.querySelector('#page-dashboard .grid-cols-1');
            const chartDiv = document.createElement('div');
            chartDiv.className = 'bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-3';
            chartDiv.innerHTML = '<h3 class="font-bold text-gray-800 mb-4">Distribuição por Matéria</h3><div class="h-64"><canvas id="chart-dashboard-distrib"></canvas></div>';
            container.parentElement.appendChild(chartDiv);
            canvas = document.getElementById('chart-dashboard-distrib');
        }

        if (this.chart) this.chart.destroy();

        if (state.materias.length === 0) return;

        const dataArr = state.materias.map(m => {
            return state.cronograma.filter(i => i.materiaId === m.id).length;
        });

        this.chart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: state.materias.map(m => m.nome),
                datasets: [{
                    data: dataArr,
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });
    }
};
