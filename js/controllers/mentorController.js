// js/controllers/mentorController.js
// Controlador da interface e interação com o Mentor IA

window.mentorController = {
    initialized: false,
    isLoading: false,
    chatHistory: [],
    currentContext: null,

    init: function() {
        if (!this.initialized) {
            this.loadHistory();
            this.bindEvents();
            this.initialized = true;
        }
        this.render();
    },

    loadHistory: function() {
        try {
            const saved = localStorage.getItem('mentor_chat_history');
            if (saved) {
                this.chatHistory = JSON.parse(saved);
            } else {
                // Mensagem de boas-vindas inicial padrão
                this.chatHistory = [
                    {
                        sender: 'mentor',
                        text: `Olá! Sou o seu **Mentor de Concursos TI**.\n\nEu tenho acesso em tempo real ao seu cronograma, revisões do Anki, sessões de foco (Pomodoro) e editais cadastrados.\n\nComo posso acelerar sua aprovação hoje? Você pode clicar em um dos botões rápidos abaixo ou me perguntar **"O que devo fazer hoje?"** para eu montar sua rotina ideal!`,
                        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    }
                ];
            }
        } catch (e) {
            this.chatHistory = [];
        }
    },

    saveHistory: function() {
        try {
            localStorage.setItem('mentor_chat_history', JSON.stringify(this.chatHistory.slice(-20)));
        } catch (e) {
            console.warn('Erro ao salvar histórico do chat:', e);
        }
    },

    bindEvents: function() {
        const form = document.getElementById('form-mentor-chat');
        const input = document.getElementById('input-mentor-msg');
        const btnClear = document.getElementById('btn-mentor-clear');

        if (form && input) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const text = input.value.trim();
                if (text && !this.isLoading) {
                    input.value = '';
                    this.sendMessage(text);
                }
            });

            // Permitir enviar com Enter (e Shift+Enter para quebra se for textarea)
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    form.dispatchEvent(new Event('submit'));
                }
            });
        }

        if (btnClear) {
            btnClear.addEventListener('click', () => {
                if (confirm('Deseja limpar as conversas do Mentor IA?')) {
                    localStorage.removeItem('mentor_chat_history');
                    this.loadHistory();
                    this.renderMessages();
                    if (window.utils) window.utils.showToast('Conversa reiniciada.', 'info');
                }
            });
        }
    },

    /**
     * Atualiza as métricas em tempo real no topo da página do Mentor
     */
    updateMetricsBanner: async function() {
        try {
            const state = window.store.getState();
            let ankiData = null;
            if (window.ankiService && typeof window.ankiService.getDueCardsCount === 'function') {
                try {
                    ankiData = await window.ankiService.getDueCardsCount();
                } catch (err) {
                    console.warn("AnkiService inacessível:", err);
                }
            }

            const ctx = window.mentorLogic.buildStudentContext(state, ankiData);
            this.currentContext = ctx;

            // Elementos visuais
            const elCronograma = document.getElementById('mentor-metric-cronograma');
            const elAnki = document.getElementById('mentor-metric-anki');
            const elPomodoro = document.getElementById('mentor-metric-pomodoro');
            const elProva = document.getElementById('mentor-metric-prova');

            if (elCronograma) {
                elCronograma.textContent = `${ctx.cronograma.porcentagemGeral} (${ctx.cronograma.concluidas}/${ctx.cronograma.totalMetas})`;
            }

            if (elAnki) {
                if (ctx.anki.status === 'Conectado') {
                    elAnki.textContent = `${ctx.anki.totalPendentesHoje} cards devidos`;
                } else {
                    elAnki.textContent = `${ctx.anki.status}`;
                }
            }

            if (elPomodoro) {
                elPomodoro.textContent = `${ctx.focoEPomodoro.horasHoje} hoje (${ctx.focoEPomodoro.sessoesConcluidasHoje} sessões)`;
            }

            if (elProva) {
                if (ctx.provasEEditais && ctx.provasEEditais.length > 0) {
                    const maisProxima = ctx.provasEEditais[0];
                    elProva.textContent = `${maisProxima.nome}: ${maisProxima.diasRestantes} dias`;
                } else {
                    elProva.textContent = 'Sem provas cadastradas';
                }
            }
        } catch (e) {
            console.error("Erro ao atualizar métricas do mentor:", e);
        }
    },

    render: async function() {
        this.renderMessages();
        await this.updateMetricsBanner();
    },

    renderMessages: function() {
        const container = document.getElementById('mentor-chat-messages');
        if (!container) return;

        let html = '';
        this.chatHistory.forEach((msg) => {
            const isUser = msg.sender === 'user';
            const formattedContent = isUser 
                ? `<p class="text-sm font-medium leading-relaxed">${window.utils ? window.utils.escapeHtml(msg.text) : msg.text}</p>`
                : window.mentorLogic.formatMarkdown(msg.text);

            html += `
                <div class="flex gap-3.5 items-start ${isUser ? 'flex-row-reverse' : ''} animate-fade-in">
                    <div class="w-8 h-8 rounded-xl ${isUser ? 'bg-gray-800' : 'bg-primary-600'} flex items-center justify-center text-white shrink-0 shadow-sm text-sm">
                        <i class="ph-bold ${isUser ? 'ph-user' : 'ph-sparkle'}"></i>
                    </div>
                    <div class="max-w-[85%] md:max-w-[75%] rounded-2xl ${isUser ? 'bg-primary-600 text-white rounded-tr-sm p-4 shadow-sm' : 'bg-white border border-gray-100 rounded-tl-sm p-5 shadow-sm text-gray-800'}">
                        <div class="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b ${isUser ? 'border-primary-500/40' : 'border-gray-100'}">
                            <span class="text-[10px] font-black uppercase tracking-wider ${isUser ? 'text-primary-100' : 'text-primary-600'}">
                                ${isUser ? 'Você' : 'Mentor Hyrtinho IA'}
                            </span>
                            <span class="text-[10px] ${isUser ? 'text-primary-200' : 'text-gray-400'} font-medium">
                                ${msg.time || ''}
                            </span>
                        </div>
                        <div class="prose-mentor space-y-1">
                            ${formattedContent}
                        </div>
                    </div>
                </div>
            `;
        });

        if (this.isLoading) {
            html += `
                <div id="mentor-typing" class="flex gap-3.5 items-start animate-fade-in">
                    <div class="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                        <i class="ph-bold ph-sparkle animate-pulse"></i>
                    </div>
                    <div class="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
                        <span class="w-2 h-2 rounded-full bg-primary-500 animate-pulse" style="animation-delay: 200ms"></span>
                        <span class="w-2 h-2 rounded-full bg-primary-500 animate-pulse" style="animation-delay: 400ms"></span>
                        <span class="text-xs text-gray-500 font-bold ml-2">Analisando suas métricas atuais com Gemini...</span>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
        this.scrollToBottom();
    },

    scrollToBottom: function() {
        const container = document.getElementById('mentor-chat-messages');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    },

    quickAsk: function(promptText) {
        if (this.isLoading) return;
        this.sendMessage(promptText);
    },

    sendMessage: async function(text) {
        if (!text || this.isLoading) return;

        const timeNow = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        // Adiciona a mensagem do usuário no histórico
        this.chatHistory.push({
            sender: 'user',
            text: text,
            time: timeNow
        });

        this.isLoading = true;
        this.renderMessages();

        try {
            // Atualiza e obtém snapshot de métricas
            const state = window.store.getState();
            let ankiData = null;
            if (window.ankiService && typeof window.ankiService.getDueCardsCount === 'function') {
                try {
                    ankiData = await window.ankiService.getDueCardsCount();
                } catch (e) {
                    console.warn("AnkiService offline ao gerar prompt:", e);
                }
            }

            const context = window.mentorLogic.buildStudentContext(state, ankiData);
            this.currentContext = context;

            // Histórico para a API (excluindo a mensagem atual que vai no payload)
            const historyForApi = this.chatHistory.slice(0, -1);

            const response = await fetch('/api/mentor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: text,
                    context: context,
                    history: historyForApi
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // Caso a variável de ambiente não esteja configurada na Vercel
                if (data.error === 'CONFIG_REQUIRED') {
                    this.chatHistory.push({
                        sender: 'mentor',
                        text: `⚠️ **Atenção: Chave de API não configurada na Vercel!**\n\nPara que o Mentor IA funcione, você precisa cadastrar a variável de ambiente **\`GEMINI_API_KEY\`** no painel da Vercel.\n\n### Passo a passo rápido:\n1. Acesse [Google AI Studio](https://aistudio.google.com/) e clique em **"Get API key"** para gerar uma chave gratuita.\n2. No painel do seu projeto na Vercel, acesse **Settings > Environment Variables**.\n3. Adicione uma variável com o nome **\`GEMINI_API_KEY\`** e cole sua chave no valor.\n4. Faça um novo Deploy (Redeploy) e a IA estará ativa imediatamente!`,
                        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    });
                } else {
                    const errMsg = data.message || 'Falha ao processar solicitação com a IA.';
                    this.chatHistory.push({
                        sender: 'mentor',
                        text: `❌ **Ocorreu um erro:** ${errMsg}\n\nVerifique se sua chave da API está correta ou tente novamente em alguns instantes.`,
                        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    });
                    if (window.utils) window.utils.showToast(errMsg, 'error');
                }
            } else if (data.reply) {
                this.chatHistory.push({
                    sender: 'mentor',
                    text: data.reply,
                    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                });
            }

            this.saveHistory();
        } catch (err) {
            console.error('Erro na chamada ao mentor:', err);
            this.chatHistory.push({
                sender: 'mentor',
                text: `❌ **Erro de conexão:** Não foi possível contactar o servidor \`/api/mentor\`. ${err.message}`,
                time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            });
            if (window.utils) window.utils.showToast(err.message, 'error');
        } finally {
            this.isLoading = false;
            this.renderMessages();
            this.updateMetricsBanner();
        }
    }
};
