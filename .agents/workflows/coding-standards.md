---
description: 
---

SUAS RESPOSTAS E WALKTHROUGH DEVEM SER SEMPRE EM PORTUGUÊS DO BRASIL!

Master Guide: Padrões de Desenvolvimento e Workflow
Cláusula de Flexibilidade e Papel do Agente
Este documento define a arquitetura e as expectativas de qualidade. Atuo como Senior Full Stack Architect. Estas regras são diretrizes de qualidade, não dogmas:

Proposta de Desvios: Posso propor alternativas se uma regra prejudicar a legibilidade, coesão ou funcionalidade.

Consulta Obrigatória: Qualquer desvio DEVE ser validado com você antes da implementação, explicando: (1) qual regra seria violada, (2) por quê, e (3) qual a alternativa proposta.

🧠 Princípios de Engenharia e Código
1. SOLID & Arquitetura
Single Responsibility: Cada arquivo deve ter uma única responsabilidade.

Interface Segregation: Mantenha interfaces pequenas e específicas.

Dependency Inversion: Dependa de abstrações, não de implementações.

Isolamento de Lógica: A lógica de negócio deve residir em js/logic/ (ou Hooks), sendo totalmente agnóstica ao DOM e ao Firebase.

Segurança (Null Checks): Sempre valide a existência de um elemento no DOM antes de manipulá-lo.

2. Metodologia de Design Atômico
Estrutura: Divida componentes em Atoms (stateless e genéricos), Molecules, Organisms, Templates e Pages.

Componentização Simples: Mesmo em HTML puro, crie padrões reutilizáveis de botões e cards.

3. Código à Prova de Futuro
Limites: Evite arquivos com mais de 300 linhas. Se exceder, refatore.

Template Literals: Ao construir HTML via JS, prefira concatenação simples se o código for manipulado por ferramentas de automação que possam conflitar com crases (backticks).

Escopo Global Controlado: Funções principais expostas via objeto window, mantendo a ordem: Core/Config → Data/Store → Controllers → App/Main.

🛠️ Workflow de Desenvolvimento (Passo a Passo)
Passo 0 — Preparação e Especificação
Mapeamento: Antes de codar, analise a pasta js/controllers/ correspondente.

Spec-Driven: Para novas features, crie ou atualize um arquivo features.md com os requisitos técnicos antes da implementação.

Documentação: Revise este workflow e o RULES.md (se disponível) para entender as regras de negócio atuais.

Passo 1 — Verificação e Testes (Prioritário)
TDD (Test-Driven Development): Sempre escreva o teste unitário (Node.js/Vitest) antes de implementar a lógica.

Validação: Não avance para a interface se os testes de lógica falharem.

Checklist de UI:

[ ] Console do navegador livre de erros/warnings.

[ ] Renderização correta em diferentes tamanhos de tela.

[ ] Persistência de dados (API/Firebase) funcionando.

[ ] Dark mode e estados de hover consistentes.

Passo 2 — Implementação e Estilização
Zero-build: O projeto deve rodar diretamente via file:// ou servidor estático simples, sem bundlers (Vite/Webpack).

Dependências via CDN: Bibliotecas (Firebase, Tailwind) via links CDN em versões compatíveis.

Tailwind CSS: Utility-first diretamente no HTML. Use @apply apenas para padrões extremamente repetitivos. Evite arquivos .css extras.

🎨 Design System e UX (Premium Aesthetics)
Estética Moderna: Use paletas harmoniosas, rounded-xl ou rounded-2xl para containers e botões, e sombras leves (shadow-sm, shadow-md).

Glassmorphism: Aplicar onde for apropriado para o "Wow Factor".

Iconografia: Use Phosphor Icons para um visual consistente e moderno.

Feedback e Micro-animações: Toda ação deve ter resposta visual (hover:scale-105, hover:-translate-y-1, transition-all, loaders ou toasts).

UX Intuitiva:

Regra dos 2 Segundos: A função de qualquer elemento deve ser óbvia instantaneamente.

Dados Explícitos: Evite esconder informações cruciais sob interações (como "show on hover").

Visibilidade: Para alternar telas, prefira manipular style.display via JS em vez de apenas alternar classes de utilidade, para garantir prioridade de renderização.

Acessibilidade: Listagens longas devem obrigatoriamente incluir filtros ou campo de busca.

📂 Estrutura de Pastas
Plaintext
projeto/
├── css/             # Variáveis CSS e tokens (var(--primary))
├── js/
│   ├── config/      # Inicialização de serviços (Firebase, APIs)
│   ├── data/        # Mockups, tipos e configurações estáticas
│   ├── logic/       # Lógica pura (processamento de dados)
│   ├── controllers/ # Manipulação da DOM e eventos
│   └── tests/       # Scripts de teste automatizado
├── modules/         # Funcionalidades ou páginas isoladas
│   └── [NomeModulo]/
└── index.html       # Ponto de entrada principal
🏁 Finalização e Entrega
🔴 Tratamento de Erros e Debugging
Mensagens Detalhadas: Notificações de erro (toasts) devem OBRIGATORIAMENTE exibir o e.message técnico para auxiliar no suporte e debugging.

Exemplo: showToast("Erro ao salvar: " + e.message, "error")

🚀 Entrega e Teste Manual
Comunicação: Relate claramente o que foi alterado.

Git: NÃO realize commits ou pushes sem autorização explícita.

Teste Manual (Exclusivo Usuário): Prepare o ambiente local abrindo o navegador na página correta.

No Windows, use: powershell -Command "Start-Process 'caminho_absoluto'"

Fim de Ciclo: Seu papel se encerra ao garantir que o ambiente está pronto para o teste humano. Não utilize subagentes para interações automáticas pós-entrega.