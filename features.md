# Especificação Técnica: Plataforma Rotinize

## 1. Visão Geral
Replicação completa da plataforma Rotinize, focada em planejamento de estudos e produtividade.

## 2. Requisitos de Interface (UI/UX)
- **Layout:** Dashboard com Sidebar (fixa à esquerda), Header (fixo no topo) e Área de Conteúdo Dinâmica.
- **Estética:** Premium (shadows, rounded-xl/2xl, transitions, micro-animações, harmonious colors).
- **Responsividade:** Mobile e Desktop (foco desktop para o dashboard).
- **Icons:** Phosphor Icons.
- **Navegação:** Sidebar com 8 seções (Visão Geral, Calendário, Trilha, Ciclo, Revisões, Histórico, Conquistas, Estatísticas).

## 3. Páginas e Componentes

### 3.1. Calendário
- Grid mensal/semanal.
- Cards coloridos por matéria.
- FAB (Floating Action Button) para nova tarefa.

### 3.2. Trilha Semanal
- Estrutura Kanban facilitada por dias da semana (Segunda a Domingo).
- Botão "+" em cada coluna.
- Ações de hover em cada card.

### 3.3. Ciclo de Estudos
- Gráfico Donut (Donut Chart) centralizado mostrando a distribuição das matérias.
- Legenda dinâmica com cores e pesos.

### 3.4. Revisões
- Sistema de filtros (Hoje, Atrasadas, Próximas).
- Tabela de controle de tópicos.

### 3.5. Histórico e Conquistas
- Timeline de ações.
- Gamificação (badges, medalhas, XP bar).

### 3.6. Estatísticas
- Dashboards com gráficos de linha e barra.
- KPIs (Horas totais, questões, % de acerto).
- Gráfico rosca por matéria e barras empilhadas por desempenho.

## 4. Requisitos Técnicos
- **Framework:** React + Vite + TypeScript.
- **Styling:** Tailwind CSS (utility-first).
- **Arquitetura:** Atomic Design (Atoms, Molecules, Organisms, Templates, Pages).
- **Lógica de Negócio:** Isolada em `src/logic/` e hooks em `src/hooks/`.
- **Backend/DB:** Firebase (placeholder para tokens futuros).
- **QA:** Testes de unidade com Vitest/Jest antes da implementação da lógica.

## 5. Fluxo de Trabalho (Workflow)
- Não realizar commits/pushes automáticos.
- Validação manual obrigatória pelo usuário ao final.
- Documentação clara no `walkthrough.md` sem mídias (conforme nova regra).
