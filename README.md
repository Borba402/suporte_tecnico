# Dashboard de Suporte Técnico

Sistema de gerenciamento e monitoramento de chamados de suporte técnico corporativo. Interface web responsiva, construída com tecnologias nativas (HTML, CSS e JavaScript puros), sem dependência de frameworks externos.

## 🖥️ Demonstração

O dashboard oferece:
- **Painel de KPIs em tempo real** — Abertos, Em Atendimento, Aguardando Peças, Concluídos
- **Gestão de Chamados** — Criação, atribuição e conclusão de tickets
- **Filtros por Categoria** — TI, Elétrica, Predial, Segurança, Telecom
- **Tema Claro/Escuro** — Com persistência via `localStorage`
- **Layout Responsivo** — Sidebar para desktop, Bottom Nav para mobile
- **Modal de Criação** — Formulário sanitizado e validado

## 🗂️ Estrutura do Projeto

```
stitch/
├── index.html   → Estrutura semântica (HTML5 + SEO + Acessibilidade)
├── style.css    → Design System com variáveis CSS (Material Design 3)
├── app.js       → Lógica e interatividade (JavaScript puro)
└── old/         → Protótipo original arquivado
```

## 🚀 Como executar localmente

**Pré-requisito:** Node.js instalado.

```bash
# Instale o servidor local (uma vez)
npm install -g http-server

# Execute na raiz do projeto
npx http-server -p 8000

# Acesse no navegador
http://localhost:8000/stitch/index.html
```

## 🎨 Design System

Baseado no **Material Design 3**. Todas as variáveis de cor, tipografia e espaçamento estão definidas em `stitch/style.css` via Custom Properties CSS (`:root`).

| Token | Valor |
|---|---|
| Fonte | Inter (Google Fonts) |
| Grid | CSS Grid + Flexbox |
| Espaçamento base | 8px |
| Border radius padrão | 0.5rem (8px) |

## 🔒 Segurança

- Zero dados sensíveis ou chaves hardcoded no código
- Sanitização de inputs com `escapeHTML()` para prevenir XSS
- Sem dependências de terceiros no runtime (apenas fontes via Google Fonts)

## 📄 Licença

Este projeto é de uso interno corporativo.
