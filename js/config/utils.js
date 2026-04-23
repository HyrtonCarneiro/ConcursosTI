window.utils = {
    showToast: function(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        const bgColor = type === 'error' ? 'bg-red-500' : (type === 'success' ? 'bg-green-500' : 'bg-blue-500');
        
        toast.className = `${bgColor} text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 transform transition-all duration-300 translate-y-2 opacity-0`;
        
        let icon = 'ph-info';
        if(type === 'error') icon = 'ph-warning-circle';
        if(type === 'success') icon = 'ph-check-circle';

        toast.innerHTML = `<i class="ph ${icon} text-xl"></i> <span>${message}</span>`;
        
        container.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-2', 'opacity-0');
        });

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('translate-y-2', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    getWeekMonday: function(dateInput) {
        if (!dateInput) return new Date().toISOString().split('T')[0];
        
        // Parse manually to avoid timezone shift (UTC vs Local)
        const [y, m, d] = dateInput.split('-').map(Number);
        const date = new Date(y, m - 1, d); 
        
        const day = date.getDay(); // 0=Sunday, 1=Monday...
        // Adjust to Monday
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        date.setDate(diff);
        
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    },

    calculateCountdown: function(targetDate, expiredText = "Prova Realizada") {
        if (!targetDate) return "";
        let target;
        if (typeof targetDate === 'string' && targetDate.includes('-')) {
            const [y, m, d] = targetDate.split('-').map(Number);
            target = new Date(y, m - 1, d, 23, 59, 59); // End of the target day
        } else {
            target = new Date(targetDate);
        }
        
        if (isNaN(target.getTime())) return "";
        
        const now = new Date();
        const diff = target - now;
        
        if (diff <= 0) return expiredText;
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) return `${days}d ${hours}h`;
        return `${hours}h restantes`;
    },
    
    formatDateBR: function(dateString) {
        const [yyyy, mm, dd] = dateString.split('-');
        return `${dd}/${mm}/${yyyy}`;
    }
};
