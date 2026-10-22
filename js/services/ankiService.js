window.ankiService = {
    /**
     * Obtém a quantidade de cards pendentes (due) para hoje.
     * Tenta primeiro a conexão local (tempo real), depois faz o fallback para a Nuvem.
     * @returns {Promise<{success: boolean, count?: number, source: 'local'|'cloud', updatedAt?: any, breakdown?: any, error?: string}>}
     */
    getDueCardsCount: async function() {
        try {
            // 1. Tentar Conexão Local (Real-time)
            let newCount = 0;
            let learnCount = 0;
            let reviewCount = 0;
            let calculated = false;

            try {
                const deckNames = await window.ankiApi.invoke("deckNames", 6);
                if (Array.isArray(deckNames) && deckNames.length > 0) {
                    const topLevelDecks = deckNames.filter(name => !deckNames.some(other => other !== name && name.startsWith(other + '::')));
                    const deckStats = await window.ankiApi.invoke("getDeckStats", 6, { decks: topLevelDecks });
                    if (deckStats && typeof deckStats === 'object') {
                        Object.values(deckStats).forEach(ds => {
                            if (ds) {
                                newCount += (ds.new_count || 0);
                                learnCount += (ds.learn_count || 0);
                                reviewCount += (ds.review_count || 0);
                            }
                        });
                        calculated = true;
                    }
                }
            } catch (errDeck) {
                console.warn("Falha no getDeckStats em ankiService, tentando busca direta:", errDeck);
            }

            if (!calculated) {
                const [learnRes, reviewRes] = await Promise.all([
                    window.ankiApi.invoke("findCards", 6, { query: "is:learn" }).catch(() => []),
                    window.ankiApi.invoke("findCards", 6, { query: "is:review is:due" }).catch(() => [])
                ]);
                learnCount = (learnRes && Array.isArray(learnRes)) ? learnRes.length : 0;
                reviewCount = (reviewRes && Array.isArray(reviewRes)) ? reviewRes.length : 0;
                newCount = 0;
            }

            return { 
                success: true, 
                source: 'local',
                count: newCount + learnCount + reviewCount,
                breakdown: { new: newCount, learn: learnCount, review: reviewCount }
            };
            
        } catch (err) {
            console.warn("Anki Local Offline. Tentando dados da Nuvem...", err.message);
            
            // 2. Fallback: Tentar dados sincronizados na Nuvem (Cloud Sync)
            try {
                const state = window.store.getState();
                if (!state.currentUser) throw new Error("Usuário não logado");

                const userDoc = await window.db.collection('users').doc(state.currentUser).get();
                if (userDoc.exists && userDoc.data().ankiSyncData) {
                    const cloudData = userDoc.data().ankiSyncData;
                    return {
                        success: true,
                        source: 'cloud',
                        updatedAt: cloudData.updatedAt,
                        count: (cloudData.counts.new || 0) + (cloudData.counts.learn || 0) + (cloudData.counts.review || 0),
                        breakdown: cloudData.counts
                    };
                }
            } catch (cloudErr) {
                console.error("Falha ao buscar dados da nuvem:", cloudErr);
            }

            return { success: false, error: "Anki e Nuvem inacessíveis." };
        }
    },

    /**
     * Obtém dados do Heatmap salvos na nuvem.
     */
    getCloudHeatmapData: async function() {
        const data = await this._getSyncData();
        return data ? (data.heatmap || []) : [];
    },

    /**
     * Obtém dados de Previsão (Forecast) salvos na nuvem.
     */
    getCloudForecastData: async function() {
        const data = await this._getSyncData();
        return data ? (data.forecast || []) : [];
    },

    /**
     * Obtém dados do Syllabus (Matérias) salvos na nuvem.
     */
    getCloudSyllabusData: async function() {
        const data = await this._getSyncData();
        return data ? (data.syllabus || {}) : {};
    },

    /**
     * Obtém dados de falhas por Tag salvos na nuvem.
     */
    getCloudTagLapses: async function() {
        const data = await this._getSyncData();
        return data ? (data.tagLapses || {}) : {};
    },

    /**
     * Helper interno para buscar ankiSyncData do Firestore
     */
    _getSyncData: async function() {
        try {
            const state = window.store.getState();
            if (!state.currentUser) return null;

            const userDoc = await window.db.collection('users').doc(state.currentUser).get();
            if (userDoc.exists) {
                return userDoc.data().ankiSyncData;
            }
        } catch (e) {
            console.error("Erro ao buscar SyncData:", e);
        }
        return null;
    }
};
