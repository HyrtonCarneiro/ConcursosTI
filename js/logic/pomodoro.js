window.pomodoroLogic = {
    timer: null,
    totalTime: 25 * 60,
    timeLeft: 25 * 60,
    isActive: false,
    mode: 'work', // 'work' or 'break'
    
    start: function(onTick, onComplete) {
        if (this.isActive) return;
        this.isActive = true;
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            if (onTick) {
                const perc = (this.timeLeft / this.totalTime) * 100;
                onTick(this.formatTime(this.timeLeft), perc);
            }
            
            if (this.timeLeft <= 0) {
                this.stop();
                if (onComplete) onComplete(this.mode);
            }
        }, 1000);
    },
    
    stop: function() {
        clearInterval(this.timer);
        this.isActive = false;
    },
    
    reset: function(mode = 'work') {
        this.stop();
        this.mode = mode;
        this.totalTime = mode === 'work' ? 25 * 60 : 5 * 60;
        this.timeLeft = this.totalTime;
        return this.formatTime(this.timeLeft);
    },
    
    formatTime: function(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
};
