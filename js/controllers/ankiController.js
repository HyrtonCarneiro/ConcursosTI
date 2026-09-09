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
            const newCards = stats.total - stats.young - stats.mature;

            matCard.innerHTML = `
                <div class="flex justify-between items-start mb-2 gap-2">
                    <h4 class="text-xs font-black text-gray-800 uppercase tracking-tight truncate" title="${subject}">${subject}</h4>
                    <span class="text-[9px] font-bold text-gray-400 shrink-0">${stats.total} cards</span>
                </div>
                <div class="flex h-1.5 w-full rounded-full overflow-hidden bg-gray-200 mb-2">
                    <div class="bg-green-500 h-full" style="width: ${maturePerc}%"></div>
                    <div class="bg-blue-400 h-full" style="width: ${youngPerc}%"></div>
                    <div class="bg-gray-300 h-full" style="width: ${newPerc}%"></div>
                </div>
                <div class="flex flex-wrap gap-x-3 gap-y-2 justify-between text-[9px] font-bold">
                    <div class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span> Maduros ${maturePerc}% (${stats.mature})<span class="anki-info-trigger" data-tooltip="Cards com intervalo de revisão ≥ 21 dias. O Anki considera que você já memorizou esse conteúdo de forma sólida.">ⓘ</span></div>
                    <div class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span> Jovens ${youngPerc}% (${stats.young})<span class="anki-info-trigger" data-tooltip="Cards já estudados com intervalo < 21 dias. Estão na fase de consolidação — você já os viu, mas ainda precisam de reforço frequente.">ⓘ</span></div>
                    <div class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0"></span> Novos ${newPerc}% (${newCards})<span class="anki-info-trigger" data-tooltip="Cards que nunca foram estudados. Estão no deck esperando para serem introduzidos na sua rotina de estudo.">ⓘ</span></div>
                    <div class="flex items-center gap-1 text-red-500"><i class="ph-bold ph-warning shrink-0"></i> ${stats.lapses} falhas<span class="anki-info-trigger" data-tooltip="Total acumulado de vezes que cards desta matéria foram respondidos como 'Errei' (Lapses). Quanto maior, mais difícil está sendo memorizar esse assunto.">ⓘ</span></div>
                </div>
            `;
            container.appendChild(matCard);
        });
    },

    updateStats: async function() {
        const elNew = document.getElementById('anki-stat-new');
        const elRev = document.getElementById('anki-stat-rev');
        const elPendente = document.getElementById('anki-stat-pendente');
        const elTime = document.getElementById('anki-stat-time');
        const elAvg = document.getElementById('anki-stat-avg');
        const elAccuracy = document.getElementById('anki-stat-accuracy');
        const elWrong = document.getElementById('anki-stat-wrong');
        const elPerformance = document.getElementById('anki-stat-performance');
        const sourceIndicator = document.getElementById('anki-source-indicator');

        try {
            const stats = await window.ankiApi.getSevenDayStats();
            
            // Update counts (7d history and current pending)
            if (elNew) elNew.textContent = stats.new7d || 0;
            if (elRev) elRev.textContent = stats.rev7d || 0;
            if (elPendente) elPendente.textContent = stats.pendente || 0;
            if (elAccuracy) elAccuracy.textContent = Math.round(stats.accuracy) + '%';
            if (elWrong) elWrong.textContent = stats.wrong || 0;
            if (elTime) elTime.textContent = Math.round(stats.timeTodayMs / 60000) + 'm';
            if (elAvg) elAvg.textContent = Math.round(stats.avgTodayMs / 1000) + 's';

            if (elPerformance) {
                const score = Math.round(stats.accuracy);
                let label = '--';
                if (stats.studied7d > 0) {
                    if (score >= 90) label = 'Elite';
                    else if (score >= 80) label = 'Sólido';
                    else if (score >= 70) label = 'Bom';
                    else if (score >= 50) label = 'Regular';
                    else label = 'Crítico';
                }
                elPerformance.textContent = label;
                elPerformance.className = `text-4xl font-black relative z-10 ${stats.studied7d > 0 ? (score >= 80 ? 'text-amber-500' : 'text-gray-400') : 'text-gray-300'}`;
            }

            if (sourceIndicator) {
                sourceIndicator.innerHTML = `<span class="flex items-center gap-1.5 text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full"><i class="ph-bold ph-plugs-connected"></i> Anki Conectado — Métricas dos últimos 7 dias</span>`;
                sourceIndicator.classList.remove('hidden');
            }

        } catch(e) {
            console.error("Error updating 7-day stats:", e);

            // Bug 5: Indicador visual quando Anki está offline
            const offlineEls = [elNew, elRev, elPendente, elAccuracy, elWrong, elTime, elAvg];
            offlineEls.forEach(el => { if (el) el.textContent = '--'; });
            if (elPerformance) { elPerformance.textContent = '--'; elPerformance.className = 'text-4xl font-black relative z-10 text-gray-300'; }

            if (sourceIndicator) {
                sourceIndicator.innerHTML = `<span class="flex items-center gap-1.5 text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full"><i class="ph-bold ph-warning"></i> Anki Fechado — Métricas de 7 dias indisponíveis</span>`;
                sourceIndicator.classList.remove('hidden');
            }
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
        
        // Transform array to a map for easy lookup
        const records = {};
        let maxReviews = 1;
        heatmapData.forEach(entry => {
            records[entry[0]] = entry[1];
            totalReviews += entry[1];
            if (entry[1] > maxReviews) maxReviews = entry[1];
        });

        // 1. Calculate streaks & stats (exact Review Heatmap extension methodology)
        const entries = Object.entries(records).filter(e => e[1] > 0);
        const daysLearnedCount = entries.length;
        
        // Chronologically sorted dates
        const sortedDates = entries.map(e => e[0]).sort();
        
        // Longest Streak calculation
        let longestStreak = 0;
        let currentRun = 0;
        let prevDate = null;
        
        sortedDates.forEach(dateStr => {
            const [y, m, d] = dateStr.split('-').map(Number);
            const curDate = new Date(y, m - 1, d);
            
            if (prevDate) {
                const diffDays = Math.round((curDate - prevDate) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    currentRun++;
                } else {
                    currentRun = 1;
                }
            } else {
                currentRun = 1;
            }
            if (currentRun > longestStreak) longestStreak = currentRun;
            prevDate = curDate;
        });

        // Current Streak calculation
        const today = new Date();
        let curStreak = 0;
        let checkDate = new Date(today);
        
        // If nothing studied today yet, check from yesterday so streak doesn't prematurely drop to 0
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (!records[todayStr] || records[todayStr] === 0) {
            checkDate.setDate(checkDate.getDate() - 1);
        }
        
        while (true) {
            const dateKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
            if (records[dateKey] > 0) {
                curStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        // Total span and percentage
        const daysToRender = 180;
        const totalSpanDays = sortedDates.length > 0 ? Math.max(daysToRender, Math.round((today - new Date(sortedDates[0])) / (1000 * 60 * 60 * 24)) + 1) : daysToRender;
        const pctLearned = totalSpanDays > 0 ? Math.round((daysLearnedCount / totalSpanDays) * 100) : 0;
        const dailyAvg = daysLearnedCount > 0 ? Math.round(totalReviews / daysLearnedCount) : 0;

        // Populate header metrics
        if (elStreak) elStreak.textContent = curStreak;
        if (elTotal) elTotal.textContent = totalReviews >= 1000 ? (totalReviews/1000).toFixed(1) + 'k' : totalReviews;

        // Populate bottom extension cards
        const elDailyAvg = document.getElementById('anki-heatmap-daily-avg');
        const elDaysLearned = document.getElementById('anki-heatmap-days-learned');
        const elLongestStreak = document.getElementById('anki-heatmap-longest-streak');
        const elCurrentStreak = document.getElementById('anki-heatmap-current-streak');
        const elTodaySummary = document.getElementById('anki-heatmap-today-summary');

        if (elDailyAvg) elDailyAvg.textContent = `${dailyAvg} cards`;
        if (elDaysLearned) elDaysLearned.textContent = `${pctLearned}% (${daysLearnedCount}d)`;
        if (elLongestStreak) elLongestStreak.textContent = `${longestStreak} dias`;
        if (elCurrentStreak) elCurrentStreak.textContent = `${curStreak} dias`;

        const studiedToday = records[todayStr] || 0;
        if (elTodaySummary) {
            if (studiedToday > 0) {
                elTodaySummary.innerHTML = `Estudado(s) <span class="text-emerald-600 font-black">${studiedToday} cartões</span> hoje`;
            } else {
                elTodaySummary.textContent = `Nenhum cartão revisado hoje ainda · ${totalReviews} no histórico`;
            }
        }

        // Vibrant emerald/green palette (8 levels)
        const colors = [
            '#a7f3d0', 
            '#6ee7b7', 
            '#34d399', 
            '#10b981', 
            '#059669', 
            '#047857', 
            '#065f46', 
            '#064e3b'
        ];

        let globalTooltip = document.getElementById('anki-global-heatmap-tooltip');
        if (!globalTooltip) {
            globalTooltip = document.createElement('div');
            globalTooltip.id = 'anki-global-heatmap-tooltip';
            globalTooltip.className = 'fixed pointer-events-none z-[9999] px-2.5 py-1.5 bg-gray-900 text-white text-[10px] whitespace-nowrap rounded-lg font-bold shadow-xl border border-white/10 opacity-0 transition-opacity duration-200';
            document.body.appendChild(globalTooltip);
        }

        for (let i = daysToRender; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            
            const formatStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const displayStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            
            const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' });
            const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
            
            const count = records[formatStr] || 0;
            const box = document.createElement('div');
            box.className = 'w-3 h-3 rounded-[3px] transition-all hover:scale-150 hover:z-10 cursor-pointer';
            
            let colorIndex = 0;
            if (count === 0) {
                box.style.backgroundColor = '#e5e7eb';
            } else {
                const ratio = Math.sqrt(count / maxReviews);
                colorIndex = Math.min(Math.floor(ratio * colors.length), colors.length - 1);
                box.style.backgroundColor = colors[colorIndex];
                box.style.boxShadow = `0 0 10px ${colors[colorIndex]}33`;
            }

            box.addEventListener('mouseenter', () => {
                globalTooltip.innerHTML = `
                    <div class="flex items-center gap-2">
                        <span class="w-1.5 h-1.5 rounded-full" style="background: ${count > 0 ? colors[colorIndex] : '#d1d5db'}"></span>
                        <span>${count} ${count === 1 ? 'revisão' : 'revisões'}</span>
                    </div>
                    <div class="text-[8.5px] text-gray-400 mt-0.5">${capWeekday}, ${displayStr}</div>
                `;
                
                setTimeout(() => {
                    const rect = box.getBoundingClientRect();
                    let left = rect.left + (rect.width / 2) - (globalTooltip.offsetWidth / 2);
                    let top = rect.top - globalTooltip.offsetHeight - 8;
                    
                    if (top < 0) top = rect.bottom + 8;
                    if (left < 0) left = 8;
                    if (left + globalTooltip.offsetWidth > window.innerWidth) {
                        left = window.innerWidth - globalTooltip.offsetWidth - 8;
                    }
                    
                    globalTooltip.style.left = left + 'px';
                    globalTooltip.style.top = top + 'px';
                    globalTooltip.style.opacity = '1';
                }, 0);
            });

            box.addEventListener('mouseleave', () => {
                globalTooltip.style.opacity = '0';
            });

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
                ctx.parentNode.appendChild(emptyMsg);
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

        // Ensure datalabels plugin is registered if available
        if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
            try { Chart.register(ChartDataLabels); } catch(e) {}
        }

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
                    backgroundColor: forecastData.map((d, i) => i === 0 ? '#253ee8' : '#3b5df5'),
                    hoverBackgroundColor: '#1d2eca',
                    borderRadius: 5,
                    borderSkipped: false,
                    barPercentage: 0.8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 22
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        grace: '15%',
                        grid: { color: '#f1f5f9' }, 
                        ticks: { font: { size: 10, family: 'Outfit' }, color: '#64748b' } 
                    },
                    x: { 
                        grid: { display: false }, 
                        ticks: { 
                            font: { size: 9.5, family: 'Outfit' },
                            color: '#64748b',
                            maxRotation: 0,
                            callback: function(val, index) {
                                // Always show index 0 (Hoje) with date, then every 3rd day
                                if (index === 0) return forecastData[0] ? forecastData[0].day : 'Hoje';
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
                        titleFont: { size: 11, family: 'Outfit', weight: '700' },
                        bodyFont: { size: 12, family: 'Outfit' },
                        displayColors: false,
                        callbacks: { 
                            title: function(items) { 
                                const item = forecastData[items[0].dataIndex];
                                return item ? (item.fullDate || item.day) : items[0].label; 
                            },
                            label: function(context) { 
                                const val = context.raw;
                                return ' ' + val + (val === 1 ? ' cartão devido' : ' cartões devidos'); 
                            } 
                        }
                    },
                    datalabels: {
                        display: function(context) {
                            return context.dataset.data[context.dataIndex] > 0;
                        },
                        align: 'top',
                        anchor: 'end',
                        offset: 3,
                        color: '#1e293b',
                        font: {
                            family: 'Outfit',
                            size: 10,
                            weight: '700'
                        },
                        formatter: function(value) {
                            return value > 0 ? value : '';
                        }
                    }
                }
            }
        });

        // Populate bottom forecast metric cards with explicit dates
        if (forecastData.length > 0) {
            const todayItem = forecastData[0];
            const tomItem = forecastData[1] || { day: 'Amanhã', count: 0, dateShort: '' };
            
            const elTodayLabel = document.getElementById('anki-forecast-label-today');
            const elTodayCount = document.getElementById('anki-forecast-count-today');
            const elTomLabel = document.getElementById('anki-forecast-label-tomorrow');
            const elTomCount = document.getElementById('anki-forecast-count-tomorrow');
            const el7dCount = document.getElementById('anki-forecast-count-7d');
            const elPeakCount = document.getElementById('anki-forecast-count-peak');
            const elPeriod = document.getElementById('anki-workload-period');
            const elSubtitle = document.getElementById('anki-workload-subtitle');

            if (elTodayLabel) elTodayLabel.textContent = `Hoje (${todayItem.dateShort})`;
            if (elTodayCount) elTodayCount.textContent = todayItem.count;

            if (elTomLabel) elTomLabel.textContent = `Amanhã (${tomItem.dateShort})`;
            if (elTomCount) elTomCount.textContent = tomItem.count;

            // Total in next 7 days
            const next7Total = forecastData.slice(0, 7).reduce((acc, curr) => acc + curr.count, 0);
            if (el7dCount) el7dCount.textContent = `${next7Total} cards`;

            // Peak in 28 days
            let peakItem = forecastData[0];
            forecastData.forEach(item => {
                if (item.count > peakItem.count) peakItem = item;
            });
            if (elPeakCount) {
                elPeakCount.textContent = peakItem.count > 0 ? `${peakItem.count} (${peakItem.dateShort})` : '0';
            }

            if (elPeriod) {
                elPeriod.textContent = `${todayItem.dateShort} a ${forecastData[forecastData.length - 1].dateShort}`;
            }
            if (elSubtitle) {
                elSubtitle.textContent = `Revisões agendadas de ${todayItem.dateShort} a ${forecastData[forecastData.length - 1].dateShort} (próximas 4 semanas)`;
            }
        }
    }
};
