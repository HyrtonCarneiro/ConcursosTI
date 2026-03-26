window.pomodoroController = {
    init: function() {
        this.cacheDOM();
        this.bindEvents();
    },

    cacheDOM: function() {
        this.timerEl = document.getElementById('pomodoro-timer');
        this.progressEl = document.getElementById('pomodoro-progress');
        this.statusEl = document.getElementById('pomodoro-status');
        this.btnToggle = document.getElementById('btn-pomodoro-toggle');
        this.btnReset = document.getElementById('btn-pomodoro-reset');
    },

    bindEvents: function() {
        if (this.btnToggle) this.btnToggle.onclick = () => this.handleToggle();
        if (this.btnReset) this.btnReset.onclick = () => this.handleReset();
    },

    handleToggle: function() {
        if (window.pomodoroLogic.isActive) {
            window.pomodoroLogic.stop();
            this.updateIcon(false);
            this.statusEl.textContent = "Pausado";
        } else {
            window.pomodoroLogic.start(
                (time, perc) => this.updateUI(time, perc),
                (mode) => this.handleComplete(mode)
            );
            this.updateIcon(true);
            this.statusEl.textContent = window.pomodoroLogic.mode === 'work' ? "Focando..." : "Descansando...";
        }
    },

    updateUI: function(time, perc) {
        if (this.timerEl) this.timerEl.textContent = time;
        if (this.progressEl) {
            const offset = 226 - (226 * perc / 100);
            this.progressEl.style.strokeDashoffset = offset;
        }
    },

    updateIcon: function(active) {
        if (!this.btnToggle) return;
        this.btnToggle.innerHTML = active ? '<i class="ph ph-pause-fill text-xl"></i>' : '<i class="ph ph-play-fill text-xl"></i>';
    },

    handleReset: function() {
        const time = window.pomodoroLogic.reset();
        this.updateUI(time, 100);
        this.updateIcon(false);
        this.statusEl.textContent = "Pronto para o Foco";
    },

    handleComplete: function(mode) {
        const nextMode = mode === 'work' ? 'break' : 'work';
        window.utils.showToast(mode === 'work' ? "Trabalho concluído! Hora de descansar." : "Descanso finalizado! Vamos voltar?", "info");
        
        window.pomodoroLogic.reset(nextMode);
        this.handleReset();
        this.statusEl.textContent = nextMode === 'work' ? "Pronto para o Foco" : "Pronto para o Descanso";
    }
};
