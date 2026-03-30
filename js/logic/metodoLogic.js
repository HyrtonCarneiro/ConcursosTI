window.metodoLogic = {
    hasAttemptedRecovery: false,

    /**
     * Carrega as notas do método do usuário.
     * @returns {Promise<Object>} O conteúdo mapeado por dia.
     */
    async loadMetodo() {
        const state = window.store.getState();
        if (!state.currentUser) return {};

        // Se já temos dados no store, apenas retorna
        if (state.metodo && Object.keys(state.metodo).length > 0) {
            return state.metodo;
        }

        // --- RECOVERY BRIDGE (Apenas uma vez se o store estiver vazio) ---
        if (!this.hasAttemptedRecovery) {
            this.hasAttemptedRecovery = true;
            console.log("METODO: Tentando recuperar dados de subcoleção legado...");
            
            // Tenta os dois caminhos possíveis (Capitalizado e minúsculo)
            const usernames = [state.currentUser, state.currentUser.toLowerCase()];
            for (const user of usernames) {
                try {
                    const doc = await window.db.collection('users').doc(user).collection('data').doc('metodo').get();
                    if (doc.exists) {
                        const data = doc.data().content;
                        let recovered = {};

                        if (typeof data === 'string') {
                            recovered = { segunda: data };
                        } else {
                            recovered = data || {};
                        }

                        if (Object.keys(recovered).length > 0) {
                            console.log(`METODO: Dados recuperados de users/${user}/data/metodo!`);
                            // Salva no store para migrar permanentemente
                            window.store.state.metodo = recovered;
                            window.store.save();
                            return recovered;
                        }
                    }
                } catch (e) {
                    console.warn(`METODO: Falha ao acessar subcoleção para ${user}:`, e.message);
                    // Se for erro de permissão, apenas continua para o próximo ou termina
                }
            }
        }

        return state.metodo || {};
    },

    /**
     * Salva as notas do método do usuário.
     * @param {Object} content Objeto com os conteúdos mapeados por dia {segunda: "...", terca: "..."}
     */
    async saveMetodo(content) {
        const state = window.store.getState();
        if (!state.currentUser) return;

        try {
            // Agora salvamos no store centralizado
            window.store.state.metodo = content;
            window.store.save();
            
            // Opcionalmente, podemos limpar a subcoleção antiga se quisermos, 
            // mas é mais seguro deixar lá como backup manual se necessário.
        } catch (e) {
            console.error("Erro ao salvar método no store:", e);
            throw e;
        }
    }
};
