window.simuladosController = {
    chart: null,
    
    init: function() {
        this.cacheDOM();
        this.bindEvents();
        this.render();
    },

    cacheDOM: function() {
        this.btnNovo = document.getElementById('btn-novo-simulado');
        this.listEl = document.getElementById('list-simulados');
        this.canvas = document.getElementById('chart-simulados');
    },

    bindEvents: function() {
        if (this.btnNovo) {
            this.btnNovo.addEventListener('click', () => this.handleNovo());
        }
    },

    handleNovo: function() {
        const nome = prompt("Nome do simulado (ex: Simulado 01 - CEF):");
        if (!nome) return;
        const nota = prompt("Sua nota / porcentagem de acertos (ex: 85):");
        if (nota === null) return;
        
        try {
            window.store.addSimulado(nome, nota);
            window.utils.showToast("Simulado registrado!", "success");
            this.render();
        } catch (e) {
            window.utils.showToast("Erro: " + e.message, "error");
        }
    },

    render: function() {
        this.renderList();
        this.renderChart();
    },

    renderList: function() {
        if (!this.listEl) return;
        const simulados = window.store.getState().simulados;
        this.listEl.innerHTML = "";
        
        if (simulados.length === 0) {
            this.listEl.innerHTML = '<p class="text-sm text-gray-500 italic">Nenhum simulado registrado.</p>';
            return;
        }

        simulados.slice().reverse().forEach(s => {
            const date = new Date(s.data).toLocaleDateString();
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100';
            div.innerHTML = ' \
                <div> \
                    <p class="text-sm font-bold text-gray-800">' + s.nome + '</p> \
                    <p class="text-[10px] text-gray-500 uppercase">' + date + '</p> \
                </div> \
                <span class="text-lg font-black text-primary-600">' + s.nota + '%</span>';
            this.listEl.appendChild(div);
        });
    },

    renderChart: function() {
        if (!this.canvas) return;
        const simulados = window.store.getState().simulados;
        
        if (this.chart) this.chart.destroy();
        
        if (simulados.length === 0) return;

        const labels = simulados.map((s, index) => 'Sim ' + (index + 1));
        const data = simulados.map(s => s.nota);

        this.chart = new Chart(this.canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Desempenho (%)',
                    data: data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointBackgroundColor: '#3b82f6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 100 }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
};
