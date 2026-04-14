window.ankiController = {
    initialized: false,
    chartWorkload: null,
    chartLapses: null,

    init: async function() {
        if (!this.initialized) {
            this.bindEvents();
            this.initialized = true;
        }
        await this.render();
    },

    bindEvents: function() {
        const btnRetry = document.getElementById('btn-anki-retry');
        if (btnRetry) {
            btnRetry.addEventListener('click', () => {
                this.render();
            });
        }

        const btnSaveUrl = document.getElementById('btn-save-anki-url');
        const btnAddUrl = document.getElementById('btn-add-anki-url');
        const inputUrl = document.getElementById('input-anki-url');

        if (btnSaveUrl) {
            btnSaveUrl.addEventListener('click', () => this.render());
        }

        if (btnAddUrl && inputUrl) {
            const addUrlHandler = () => {
                const newUrl = inputUrl.value.trim();
                if (newUrl) {
                    window.ankiApi.addUrl(newUrl);
                    inputUrl.value = '';
                    window.utils.showToast("Endereço adicionado!", "success");
                    this.renderSavedUrls();
                } else {
                    window.utils.showToast("Informe um endereço válido.", "error");
                }
            };
            btnAddUrl.addEventListener('click', addUrlHandler);
            inputUrl.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') { e.preventDefault(); addUrlHandler(); }
            });
        }
    },

    renderSavedUrls: function() {
        var container = document.getElementById('anki-saved-urls-list');
        if (!container) return;

        var urls = window.ankiApi.getUrls();
        var lastWorking = localStorage.getItem('anki_connect_last_working');

        container.innerHTML = urls.map(function(url) {
            var display = url.replace('http://', '');
            var isLast = (url === lastWorking);
            var statusIcon = isLast ? 'ph-check-circle text-green-500' : 'ph-desktop text-gray-400';
            var badge = isLast ? '<span class="text-[8px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full uppercase tracking-widest shrink-0">Último</span>' : '';

            return '<div class="flex items-center justify-between bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-100 group hover:border-primary-200 transition-all">'
                + '<div class="flex items-center gap-2 min-w-0">'
                + '<i class="ph-bold ' + statusIcon + ' text-sm shrink-0"></i>'
                + '<span class="text-xs font-bold text-gray-700 truncate">' + display + '</span>'
                + badge
                + '</div>'
                + '<button onclick="window.ankiController.removeAnkiUrl(\'' + url + '\')" class="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors shrink-0 md:opacity-0 md:group-hover:opacity-100">'
                + '<i class="ph-bold ph-x text-xs"></i>'
                + '</button>'
                + '</div>';
        }).join('');
    },

    removeAnkiUrl: function(url) {
        window.ankiApi.removeUrl(url);
        this.renderSavedUrls();
        window.utils.showToast("Endereço removido.", "info");
    },

    render: async function() {
        const containerApp = document.getElementById('anki-app-container');
        const containerError = document.getElementById('anki-error-container');
        
        // Exibir loading ou ocultar error preventivamente
        containerApp.classList.add('hidden');
        containerError.classList.add('hidden');
        
        const isConnected = await window.ankiApi.checkConnection();
        
        if (!isConnected) {
            // Se falhar o local, tentamos ver se existe dado na nuvem antes de mostrar o erro
            const cloudCheck = await window.ankiService.getDueCardsCount();
            if (!cloudCheck.success || cloudCheck.source !== 'cloud') {
                containerError.classList.remove('hidden');
                this.renderSavedUrls();
                return;
            }
            console.log("Modo Nuvem Ativado: Anki Local offline, exibindo cache.");
        }

        containerApp.classList.remove('hidden');

        // 1. Carga em paralelo das estatísticas (não-bloqueante)
        const loadStats = async (label, fn) => {
            try {
                await fn();
            } catch (err) {
                console.error(`Falha ao carregar ${label}:`, err);
            }
        };

        loadStats("Stats Gerais", () => this.updateStats());
        loadStats("Heatmap", () => this.renderHeatmap());
        loadStats("Syllabus", () => this.renderSyllabus());
        loadStats("Lapses", () => this.renderTagPerformance());
        loadStats("Forecast", () => this.renderWorkloadForecast());
    },

    showNotification: function(msg, type = 'success') {
        window.utils.showToast(msg, type);
    },


    renderSyllabus: async function() {
        const container = document.getElementById('anki-syllabus-list');
        if (!container) return;

        container.innerHTML = '<div class="flex items-center justify-center p-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>';

        const data = await window.ankiApi.getSyllabusData();
        container.innerHTML = '';

        const materias = Object.keys(data).sort((a,b) => data[b].total - data[a].total);

        if (materias.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-400 text-sm py-10">Nenhuma matéria com cards encontrada.</p>';
            return;
        }

        materias.forEach(subject => {
            const stats = data[subject];
            const matCard = document.createElement('div');
            matCard.className = 'bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:border-primary-200 transition-all group';
            
            const youngPerc = Math.round((stats.young / stats.total) * 100);
            const maturePerc = Math.round((stats.mature / stats.total) * 100);
            const newPerc = 100 - youngPerc - maturePerc;

            matCard.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <h4 class="text-xs font-black text-gray-800 uppercase tracking-tight">${subject}</h4>
                    <span class="text-[9px] font-bold text-gray-400">${stats.total} cards</span>
                </div>
                <div class="flex h-1.5 w-full rounded-full overflow-hidden bg-gray-200 mb-2">
                    <div class="bg-green-500 h-full" style="width: ${maturePerc}%"></div>
                    <div class="bg-blue-400 h-full" style="width: ${youngPerc}%"></div>
                    <div class="bg-gray-300 h-full" style="width: ${newPerc}%"></div>
                </div>
                <div class="flex justify-between text-[9px] font-bold">
                    <div class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> Maduros ${maturePerc}%</div>
                    <div class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Jovens ${youngPerc}%</div>
                    <div class="flex items-center gap-1 text-red-500"><i class="ph-bold ph-warning"></i> ${stats.lapses} falhas</div>
                </div>
            `;
            container.appendChild(matCard);
        });
    },

    updateStats: async function() {
        const res = await window.ankiService.getDueCardsCount();
        
        const elDue = document.getElementById('anki-stat-due');
        const elLearn = document.getElementById('anki-stat-learn');
        const elNew = document.getElementById('anki-stat-new');
        const elTime = document.getElementById('anki-stat-time');
        const elAvg = document.getElementById('anki-stat-avg');
        const sourceIndicator = document.getElementById('anki-source-indicator');

        if (res.success) {
            if (elDue) elDue.textContent = res.breakdown.review || 0;
            if (elLearn) elLearn.textContent = res.breakdown.learn || 0;
            if (elNew) elNew.textContent = res.breakdown.new || 0;

            if (res.source === 'cloud') {
                if (sourceIndicator) {
                    sourceIndicator.innerHTML = `<span class="flex items-center gap-1.5 text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full"><i class="ph-bold ph-cloud-slash"></i> Offline (Nuvem)</span>`;
                    sourceIndicator.classList.remove('hidden');
                }
            } else {
                if (sourceIndicator) {
                    sourceIndicator.innerHTML = `<span class="flex items-center gap-1.5 text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full"><i class="ph-bold ph-broadcast"></i> Local (Real-time)</span>`;
                    sourceIndicator.classList.remove('hidden');
                }
            }
        }
        
        // Dados de tempo (apenas se local)
        if (res.source === 'local') {
            try {
                const stats = await window.ankiApi.getTodayStats();
                if (elTime) elTime.textContent = Math.round(stats.timeMs / 60000) + 'm';
                if (elAvg) elAvg.textContent = Math.round(stats.avgMs / 1000) + 's';
            } catch(e) {}
        } else {
            if (elTime) elTime.textContent = '--';
            if (elAvg) elAvg.textContent = '--';
        }
    },

    renderHeatmap: async function() {
        const heatmapData = await window.ankiApi.getHeatmapData();
        const container = document.getElementById('anki-heatmap-grid');
        const elStreak = document.getElementById('anki-heatmap-streak');
        const elTotal = document.getElementById('anki-heatmap-total');
        if (!container) return;
        
        container.innerHTML = '';
        
        let totalReviews = 0;
        let streak = 0;
        let currentStreakCount = 0;
        
        // Transform array to a map for easy lookup
        const records = {};
        let maxReviews = 1;
        heatmapData.forEach(entry => {
            records[entry[0]] = entry[1];
            totalReviews += entry[1];
            if (entry[1] > maxReviews) maxReviews = entry[1];
        });

        // Calculate current streak
        const today = new Date();
        const checkDate = new Date(today);
        while (records[`${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`] > 0) {
            currentStreakCount++;
            checkDate.setDate(checkDate.getDate() - 1);
        }
        
        if (elStreak) elStreak.textContent = currentStreakCount;
        if (elTotal) elTotal.textContent = totalReviews >= 1000 ? (totalReviews/1000).toFixed(1) + 'k' : totalReviews;

        const daysToRender = 180;
        for (let i = daysToRender; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            
            const formatStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const displayStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            
            const count = records[formatStr] || 0;
            const box = document.createElement('div');
            box.className = 'w-3 h-3 rounded-sm transition-all hover:scale-125 hover:z-10 cursor-pointer relative group';
            
            if (count === 0) {
                box.classList.add('bg-gray-100');
            } else {
                const ratio = count / maxReviews;
                if (ratio < 0.25) box.classList.add('bg-green-200');
                else if (ratio < 0.5) box.classList.add('bg-green-400');
                else if (ratio < 0.75) box.classList.add('bg-green-600');
                else box.classList.add('bg-green-800');
            }

            const tooltip = document.createElement('div');
            tooltip.className = 'absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-[9px] whitespace-nowrap rounded font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20';
            tooltip.textContent = `${count} revs em ${displayStr}`;
            box.appendChild(tooltip);
            container.appendChild(box);
        }
    },

    renderTagPerformance: async function() {
        const ctx = document.getElementById('chart-anki-lapses');
        if (!ctx) return;

        const lapsesData = await window.ankiApi.getTagLapses();
        const labels = Object.keys(lapsesData);
        
        const emptyMsgId = 'anki-lapses-empty-msg';
        let emptyMsg = document.getElementById(emptyMsgId);

        if (labels.length === 0) {
            ctx.style.display = 'none';
            if (!emptyMsg) {
                emptyMsg = document.createElement('div');
                emptyMsg.id = emptyMsgId;
                emptyMsg.className = 'flex flex-col items-center justify-center text-gray-400 w-full h-full';
                emptyMsg.innerHTML = '<i class="ph-fill ph-check-circle text-4xl mb-2 text-green-500"></i><p class="text-sm font-bold text-center">Nenhum erro crítico detectado!</p><p class="text-xs text-center mt-1 leading-relaxed">Você ainda não errou cartões repetidas vezes nas revisões<br>ou seus cartões no Anki não possuem <b>Tags</b>.</p>';
                ctx.parentElement.appendChild(emptyMsg);
            } else {
                emptyMsg.style.display = 'flex';
            }
            if (this.chartLapses) {
                this.chartLapses.destroy();
            }
            return;
        } else {
            ctx.style.display = 'block';
            if (emptyMsg) emptyMsg.style.display = 'none';
        }

        // Sort by most errors
        labels.sort((a, b) => lapsesData[b] - lapsesData[a]);
        
        // Top 10 to not overcrowd the pie chart
        const topLabels = labels.slice(0, 10);
        const topValues = topLabels.map(l => lapsesData[l]);

        if (this.chartLapses) {
            this.chartLapses.destroy();
        }

        const colors = [
            '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', 
            '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7'
        ];

        this.chartLapses = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: topLabels,
                datasets: [{
                    data: topValues,
                    backgroundColor: colors,
                    borderWidth: 2,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 10, font: { family: 'Outfit' } } },
                    tooltip: { callbacks: { label: function(context) { return ' ' + context.label + ': ' + context.raw + ' erros'; } } },
                    datalabels: { display: false } // hide external plugin text if used globally
                },
                cutout: '70%'
            }
        });
    },

    renderWorkloadForecast: async function() {
        const ctx = document.getElementById('chart-anki-workload');
        if (!ctx) return;

        const forecastData = await window.ankiApi.getWorkloadForecast(28); // 28 days forecast
        
        const labels = forecastData.map(d => d.day);
        const data = forecastData.map(d => d.count);

        if (this.chartWorkload) {
            this.chartWorkload.destroy();
        }

        this.chartWorkload = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revisões Devidas',
                    data: data,
                    backgroundColor: forecastData.map((d, i) => i === 0 ? '#3b82f6' : '#e5e7eb'),
                    hoverBackgroundColor: '#3b82f6',
                    borderRadius: 4,
                    barPercentage: 0.8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        beginAtZero: true, 
                        grid: { color: '#f9fafb' }, 
                        ticks: { font: { size: 9, family: 'Outfit' } } 
                    },
                    x: { 
                        grid: { display: false }, 
                        ticks: { 
                            font: { size: 9, family: 'Outfit' },
                            maxRotation: 0,
                            callback: function(val, index) {
                                // Show only every 3rd label for better readability if many days
                                return index % 3 === 0 ? this.getLabelForValue(val) : '';
                            }
                        } 
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#111827',
                        padding: 12,
                        titleFont: { size: 10, family: 'Outfit', weight: '900' },
                        bodyFont: { size: 12, family: 'Outfit' },
                        displayColors: false,
                        callbacks: { 
                            title: function(items) { return items[0].label; },
                            label: function(context) { return ' ' + context.raw + ' cartões devidos'; } 
                        }
                    },
                    datalabels: { display: false }
                }
            }
        });
    }
};
