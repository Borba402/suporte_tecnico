document.addEventListener('DOMContentLoaded', () => {
  // --- Estados do Sistema ---
  let tickets = [
    { id: 'TK-2026-01', title: 'Servidor fora do ar', category: 'TI', priority: 'critical', status: 'pending' },
    { id: 'TK-2026-02', title: 'Queda de disjuntor Setor B', category: 'Elétrica', priority: 'high', status: 'in-progress' },
    { id: 'TK-2026-03', title: 'Câmera offline Entrada 2', category: 'Segurança', priority: 'medium', status: 'validating' },
    { id: 'TK-2026-04', title: 'Vazamento no banheiro P3', category: 'Predial', priority: 'low', status: 'pending' }
  ];

  let currentCategoryFilter = 'all';

  // --- Elementos do DOM ---
  const menuToggle = document.getElementById('menuToggle');
  const navDrawer = document.getElementById('navDrawer');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const ticketsBody = document.getElementById('ticketsBody');
  const openModalBtns = document.querySelectorAll('.open-modal-btn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const ticketModal = document.getElementById('ticketModal');
  const ticketForm = document.getElementById('ticketForm');
  const themeToggle = document.getElementById('themeToggle');

  // Criar overlay de fundo para fechar a sidebar no mobile
  const drawerOverlay = document.createElement('div');
  drawerOverlay.className = 'modal-overlay';
  document.body.appendChild(drawerOverlay);

  // --- Funções Auxiliares ---
  
  // Atualizar contadores do KPI
  const updateKPIs = () => {
    const counts = {
      opened: 0,
      inProgress: 0,
      waiting: 0,
      completed: 0
    };

    tickets.forEach(ticket => {
      if (ticket.status === 'pending') counts.opened++;
      else if (ticket.status === 'in-progress') counts.inProgress++;
      else if (ticket.status === 'validating') counts.waiting++;
      else if (ticket.status === 'resolved') counts.completed++;
    });

    // Atualizar no DOM se os elementos existirem
    const countAbertos = document.getElementById('kpi-abertos');
    const countEmAtendimento = document.getElementById('kpi-atendimento');
    const countAguardando = document.getElementById('kpi-aguardando');
    const countConcluidos = document.getElementById('kpi-concluidos');

    if (countAbertos) countAbertos.textContent = counts.opened;
    if (countEmAtendimento) countEmAtendimento.textContent = counts.inProgress;
    if (countAguardando) countAguardando.textContent = counts.waiting;
    if (countConcluidos) countConcluidos.textContent = counts.completed;
  };

  // Renderizar tabela de chamados
  const renderTickets = () => {
    if (!ticketsBody) return;

    ticketsBody.innerHTML = '';

    const filteredTickets = tickets.filter(ticket => {
      if (currentCategoryFilter === 'all') return true;
      return ticket.category.toLowerCase() === currentCategoryFilter.toLowerCase();
    });

    if (filteredTickets.length === 0) {
      ticketsBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 32px; color: var(--on-surface-variant);">
            Nenhum chamado encontrado nesta categoria.
          </td>
        </tr>
      `;
      return;
    }

    filteredTickets.forEach(ticket => {
      const tr = document.createElement('tr');
      tr.className = 'group';

      // Prioridade Formatação
      const priorityNames = { critical: 'CRÍTICA', high: 'ALTA', medium: 'MÉDIA', low: 'BAIXA' };
      const statusNames = { pending: 'Pendente', 'in-progress': 'Em Progresso', validating: 'Validando', resolved: 'Concluído' };

      tr.innerHTML = `
        <td>
          <div class="ticket-title-cell">
            <div class="ticket-prio-bar ${ticket.priority}"></div>
            <div class="ticket-title-info">
              <span class="ticket-title">${escapeHTML(ticket.title)}</span>
              <span class="ticket-id">#${ticket.id}</span>
            </div>
          </div>
        </td>
        <td><span class="category-badge">${escapeHTML(ticket.category)}</span></td>
        <td>
          <span class="chip-priority ${ticket.priority}">${priorityNames[ticket.priority] || ticket.priority}</span>
        </td>
        <td>
          <span class="status-label ${ticket.status}">
            ${statusNames[ticket.status] || ticket.status}
          </span>
        </td>
        <td>
          <div class="actions-cell-wrapper">
            <button class="btn-icon-action view-btn" data-id="${ticket.id}" title="Detalhes">
              <span class="material-symbols-outlined text-sm">visibility</span>
            </button>
            ${ticket.status === 'pending' ? `
              <button class="btn-small-action assign-btn" data-id="${ticket.id}" title="Atribuir">
                Atribuir
              </button>
            ` : ticket.status === 'in-progress' ? `
              <button class="btn-small-action resolve-btn" data-id="${ticket.id}" style="background-color: var(--success-container); color: var(--on-success-container); border-color: var(--success);" title="Concluir">
                Concluir
              </button>
            ` : `
              <span style="font-size: 12px; color: var(--on-surface-variant); font-weight: 500; padding: 6px 12px;">Pronto</span>
            `}
          </div>
        </td>
      `;

      ticketsBody.appendChild(tr);
    });

    // Re-vincular eventos de ação da tabela
    bindTableActions();
  };

  const bindTableActions = () => {
    // Ação: Atribuir chamado (Pendente -> Em Progresso)
    document.querySelectorAll('.assign-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const ticketIndex = tickets.findIndex(t => t.id === id);
        if (ticketIndex !== -1) {
          tickets[ticketIndex].status = 'in-progress';
          updateKPIs();
          renderTickets();
        }
      });
    });

    // Ação: Concluir chamado (Em Progresso -> Concluído)
    document.querySelectorAll('.resolve-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const ticketIndex = tickets.findIndex(t => t.id === id);
        if (ticketIndex !== -1) {
          tickets[ticketIndex].status = 'resolved';
          updateKPIs();
          renderTickets();
        }
      });
    });

    // Ação: Ver detalhes
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const ticket = tickets.find(t => t.id === id);
        if (ticket) {
          alert(`Chamado: ${ticket.title}\nID: ${ticket.id}\nCategoria: ${ticket.category}\nPrioridade: ${ticket.priority}\nStatus: ${ticket.status}`);
        }
      });
    });
  };

  // Prevenir ataques XSS simples nos inputs
  const escapeHTML = (str) => {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  };

  // --- Listeners de Eventos ---

  // Sidebar (Menu Mobile)
  if (menuToggle && navDrawer) {
    const openMenu = () => {
      navDrawer.classList.add('active');
      drawerOverlay.classList.add('active');
      drawerOverlay.style.zIndex = '35'; // Fica abaixo da navDrawer (40) mas acima do resto
    };

    const closeMenu = () => {
      navDrawer.classList.remove('active');
      drawerOverlay.classList.remove('active');
    };

    menuToggle.addEventListener('click', openMenu);
    drawerOverlay.addEventListener('click', closeMenu);
  }

  // Filtros de Categoria
  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterButtons.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      
      currentCategoryFilter = e.currentTarget.getAttribute('data-category');
      renderTickets();
    });
  });

  // Alternador de Temas (Claro / Escuro)
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  }

  if (themeToggle) {
    // Definir ícone inicial baseado no tema atual
    const updateThemeIcon = () => {
      const isDark = document.documentElement.classList.contains('dark');
      themeToggle.querySelector('span').textContent = isDark ? 'light_mode' : 'dark_mode';
    };
    updateThemeIcon();

    themeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      updateThemeIcon();
    });
  }

  // Modal para Criar Novo Chamado
  const openModal = () => {
    if (ticketModal) ticketModal.classList.add('active');
  };

  const closeModal = () => {
    if (ticketModal) {
      ticketModal.classList.remove('active');
      ticketForm.reset();
    }
  };

  openModalBtns.forEach(btn => btn.addEventListener('click', openModal));
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (ticketModal) {
    ticketModal.addEventListener('click', (e) => {
      if (e.target === ticketModal) closeModal();
    });
  }

  // Envio do Formulário de Novo Chamado
  if (ticketForm) {
    ticketForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const title = document.getElementById('ticketTitle').value.trim();
      const category = document.getElementById('ticketCategory').value;
      const priority = document.getElementById('ticketPriority').value;

      if (!title) {
        alert('Por favor, digite um título descritivo para o chamado.');
        return;
      }

      // Gerar ID no mesmo formato do protótipo
      const year = new Date().getFullYear();
      const ticketNum = String(tickets.length + 1).padStart(2, '0');
      const id = `TK-${year}-${ticketNum}`;

      // Adicionar novo chamado
      tickets.unshift({
        id,
        title,
        category,
        priority,
        status: 'pending' // Novo chamado sempre abre como Pendente
      });

      // Recarregar os dados do dashboard
      updateKPIs();
      renderTickets();
      closeModal();
    });
  }

  // --- Inicialização ---
  updateKPIs();
  renderTickets();
});
