window.pomodoroLogic = {
    timer: null,
    timeLeft: 25 * 60,
    isActive: false,
    mode: 'work', // 'work' or 'break'
    
    start: function(onTick, onComplete) {
        if (this.isActive) return;
        this.isActive = true;
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            if (onTick) onTick(this.formatTime(this.timeLeft));
            
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
        this.timeLeft = mode === 'work' ? 25 * 60 : 5 * 60;
        return this.formatTime(this.timeLeft);
    },
    
    formatTime: function(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
};
