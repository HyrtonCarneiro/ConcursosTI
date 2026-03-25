window.pomodoroController = {
    init: function() {
        this.cacheDOM();
        this.bindEvents();
    },

    cacheDOM: function() {
        this.widget = document.getElementById('pomodoro-widget');
        this.content = document.getElementById('pomodoro-content');
        this.timerEl = document.getElementById('pomo-timer');
        this.labelEl = document.getElementById('pomo-label');
        this.materiaEl = document.getElementById('pomo-materia');
        this.btnToggle = document.getElementById('btn-pomo-toggle');
        this.btnReset = document.getElementById('btn-pomo-reset');
        this.btnFab = document.getElementById('btn-pomo-fab');
        this.btnClose = document.getElementById('btn-pomo-close');
    },

    bindEvents: function() {
        this.btnFab.addEventListener('click', () => this.toggleWidget());
        this.btnClose.addEventListener('click', () => this.toggleWidget(false));
        this.btnToggle.addEventListener('click', () => this.handleToggle());
        this.btnReset.addEventListener('click', () => this.handleReset());
    },

    toggleWidget: function(force) {
        const show = typeof force === 'boolean' ? force : this.content.classList.contains('opacity-0');
        if (show) {
            this.content.classList.remove('translate-y-20', 'opacity-0');
        } else {
            this.content.classList.add('translate-y-20', 'opacity-0');
        }
    },

    openWithContext: function(text) {
        this.materiaEl.textContent = text;
        this.toggleWidget(true);
    },

    handleToggle: function() {
        if (window.pomodoroLogic.isActive) {
            window.pomodoroLogic.stop();
            this.btnToggle.textContent = 'Retomar';
            this.btnToggle.className = 'flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-medium transition-all';
        } else {
            window.pomodoroLogic.start(
                (time) => { this.timerEl.textContent = time; },
                (mode) => { this.handleComplete(mode); }
            );
            this.btnToggle.textContent = 'Pausar';
            this.btnToggle.className = 'flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-xl font-medium transition-all';
        }
    },

    handleReset: function() {
        const time = window.pomodoroLogic.reset();
        this.timerEl.textContent = time;
        this.btnToggle.textContent = 'Iniciar';
        this.btnToggle.className = 'flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-xl font-medium transition-all';
    },

    handleComplete: function(mode) {
        window.utils.showToast(mode === 'work' ? "Hora de descansar!" : "Hora de focar!", "info");
        const nextMode = mode === 'work' ? 'break' : 'work';
        this.labelEl.textContent = nextMode === 'work' ? 'Modo Foco' : 'Descanso';
        this.handleReset();
        window.pomodoroLogic.reset(nextMode);
        this.timerEl.textContent = window.pomodoroLogic.formatTime(window.pomodoroLogic.timeLeft);
    }
};
