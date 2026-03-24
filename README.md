# Rotinize Replication - Hub San Paolo

Este projeto é uma replicação de alta fidelidade da plataforma Rotinize, construído com React, TypeScript e Tailwind CSS.

## 🚀 Como Rodar o Projeto

Devido à natureza do ambiente de desenvolvimento (unidade de rede/nuvem), o `npm install` pode enfrentar problemas de escrita na pasta `node_modules`. Recomenda-se seguir estes passos:

1. **Clone ou Mova** este projeto para um diretório local (ex: `C:\Projetos\hubsanpaolo`).
2. Abra o terminal na pasta do projeto.
3. Execute a instalação das dependências:
   ```bash
   npm install
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
5. O site estará disponível em `http://localhost:5173`.

## 📁 Estrutura do Projeto (Atomic Design)

- `src/components/atoms`: Componentes básicos (Botões, Logos, etc).
- `src/components/molecules`: Componentes médios (Cards, Itens de Lista).
- `src/components/organisms`: Componentes complexos (Sidebar, Header).
- `src/components/templates`: Layouts globais (DashboardLayout).
- `src/pages`: Páginas completas (Estatísticas, Calendário, etc).
- `src/logic`: Lógica de negócio pura (agnóstica ao React).
- `src/hooks`: Hooks para gerenciamento de estado.

## 🛠️ Tecnologias Utilizadas

- **React + Vite** (Fast Refresh e Build otimizado).
- **TypeScript** (Tipagem estrita para maior segurança).
- **Tailwind CSS** (Estilização utility-first).
- **Phosphor Icons** (Ícones modernos).
- **Chart.js** (Gráficos interativos).

---
**Nota:** O Firebase está configurado como um esqueleto pronto para receber os tokens de acesso e ser ativado.
