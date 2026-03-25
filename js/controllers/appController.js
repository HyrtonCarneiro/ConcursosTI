window.appControllers = {
    init: function() {
        this.checkAuth();
        this.bindEvents();
    },

    checkAuth: function() {
        if (window.store.getState().isAuthenticated) {
            document.getElementById('view-login').classList.add('hidden');
            document.getElementById('view-app').classList.remove('hidden');
            this.navigate('dashboard'); // default route
        } else {
            document.getElementById('view-login').classList.remove('hidden');
            document.getElementById('view-app').classList.add('hidden');
        }
    },

    bindEvents: function() {
        const formLogin = document.getElementById('form-login');
        if (formLogin) {
            formLogin.addEventListener('submit', (e) => {
                e.preventDefault();
                const user = document.getElementById('input-username').value;
                const pass = document.getElementById('input-password').value;
                
                try {
                    if (window.authLogic.login(user, pass)) {
                        window.store.getState().isAuthenticated = true;
                        window.utils.showToast("Login realizado com sucesso!", "success");
                        this.checkAuth();
                    }
                } catch (err) {
                    window.utils.showToast("Erro no login: " + err.message, "error");
                }
            });
        }

        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                window.store.getState().isAuthenticated = false;
                document.getElementById('input-password').value = '';
                this.checkAuth();
                window.utils.showToast("Você saiu da conta.", "info");
            });
        }
    },

    navigate: function(pageId) {
        // Hide all pages
        document.querySelectorAll('.page-section').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('block');
        });
        
        // Show target page
        const target = document.getElementById('page-' + pageId);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('block');
        }
        
        // Update nav buttons styling
        const navs = ['dashboard', 'editais', 'cadastros', 'cronograma'];
        navs.forEach(nav => {
            const btn = document.getElementById('nav-' + nav);
            if (btn) {
                if (nav === pageId) {
                    btn.classList.add('bg-primary-50', 'text-primary-600');
                    btn.classList.remove('bg-gray-100', 'text-gray-600');
                } else {
                    btn.classList.remove('bg-primary-50', 'text-primary-600');
                    btn.classList.add('text-gray-600');
                }
            }
        });

        // Trigger page-specific initializations
        if (pageId === 'dashboard') {
            this.updateDashboard();
        }
        if (pageId === 'cadastros') {
            if (window.cadastrosController) window.cadastrosController.renderMateriasSelect();
        }
        if (pageId === 'cronograma') {
            if (window.cronogramaController) window.cronogramaController.renderTable();
        }
    },

    updateDashboard: function() {
        const state = window.store.getState();
        const totalMaterias = state.materias.length;
        const totalPlan = state.cronograma.length;
        const totalPaginas = state.cronograma.reduce((acc, curr) => acc + curr.paginas, 0);

        const elMaterias = document.getElementById('dash-total-materias');
        const elConteudos = document.getElementById('dash-total-conteudos');
        const elPaginas = document.getElementById('dash-total-paginas');

        if (elMaterias) elMaterias.textContent = totalMaterias;
        if (elConteudos) elConteudos.textContent = totalPlan;
        if (elPaginas) elPaginas.textContent = totalPaginas;
    }
};
