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

    getWeekMonday: function(dateString) {
        // Given an ISO date YYYY-MM-DD, return the Monday of that week
        const date = new Date(dateString + 'T12:00:00'); // avoid timezone issues
        const day = date.getDay();
        const diff = date.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(date.setDate(diff));
        
        const yyyy = monday.getFullYear();
        const mm = String(monday.getMonth() + 1).padStart(2, '0');
        const dd = String(monday.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    },
    
    formatDateBR: function(dateString) {
        const [yyyy, mm, dd] = dateString.split('-');
        return `${dd}/${mm}/${yyyy}`;
    }
};
