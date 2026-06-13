import { onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp, collection, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { auth, db } from "./firebaseConfig.js";
import {
  loginUsuario,
  logoutUsuario,
  obterPerfilUsuario,
  criarChamado,
  atualizarChamado,
  listarChamadosPorPerfil
} from "./firebaseService.js";

document.addEventListener('DOMContentLoaded', () => {

  // ─── ESTADO GLOBAL ─────────────────────────────────────────
  let userProfile   = null;
  let allTickets    = [];
  let allUsers      = [];
  let currentCategoryFilter = 'all';
  let currentSection        = 'dashboard';

  // ─── ELEMENTOS DO DOM ──────────────────────────────────────

  // Auth
  const authSection      = document.getElementById('authSection');
  const appContainer     = document.getElementById('appContainer');
  const tabLoginBtn      = document.getElementById('tabLoginBtn');
  const tabRegisterBtn   = document.getElementById('tabRegisterBtn');
  const loginForm        = document.getElementById('loginForm');
  const registerForm     = document.getElementById('registerForm');
  const authTitle        = document.getElementById('authTitle');
  const authSubtitle     = document.getElementById('authSubtitle');
  const authHeaderIcon   = document.querySelector('.auth-header-icon .material-symbols-outlined');

  // Sidebar / Perfil
  const userDisplayName  = document.getElementById('userDisplayName');
  const userDisplayRole  = document.getElementById('userDisplayRole');
  const roleLabel        = document.getElementById('roleLabel');
  const navAvatar        = document.getElementById('navAvatar');
  const navRoleBadge     = document.getElementById('navRoleBadge');
  const navBadgePendentes = document.getElementById('navBadgePendentes');
  const navDrawer        = document.getElementById('navDrawer');
  const menuToggle       = document.getElementById('menuToggle');
  const adminOnlyElements        = document.querySelectorAll('.admin-only');
  const tecnicoAdminOnlyElements = document.querySelectorAll('.tecnico-admin-only');

  // Links de Navegação Desktop
  const navDashboard   = document.getElementById('nav-dashboard');
  const navMeusChamados = document.getElementById('nav-meus-chamados');
  const navUsers       = document.getElementById('nav-users');
  const navLogout      = document.getElementById('nav-logout');

  // Links Mobile
  const mobileNavHome    = document.getElementById('mobile-nav-home');
  const mobileNavMeus    = document.getElementById('mobile-nav-meus');
  const mobileNavUsers   = document.getElementById('mobile-nav-users');
  const mobileNavLogout  = document.getElementById('mobile-nav-logout');

  // Conteúdos SPA
  const dashboardContent  = document.getElementById('dashboardContent');
  const adminUsersContent = document.getElementById('adminUsersContent');
  const tecnicoContent    = document.getElementById('tecnicoContent');

  // Header & tema
  const themeToggle  = document.getElementById('themeToggle');
  const btnRefresh   = document.getElementById('btnRefresh');
  const pageTitle    = document.getElementById('pageTitle');

  // Welcome Banner
  const welcomeTitle    = document.getElementById('welcomeTitle');
  const welcomeSubtitle = document.getElementById('welcomeSubtitle');

  // Tabela de Chamados
  const ticketsBody       = document.getElementById('ticketsBody');
  const ticketsTableTitle = document.getElementById('ticketsTableTitle');
  const filterButtons     = document.querySelectorAll('.filter-btn');
  const tableEmptyState   = document.getElementById('tableEmptyState');

  // Tabela Admin
  const usersTableBody = document.getElementById('usersTableBody');
  const userSearchInput = document.getElementById('userSearchInput');
  const usersEmptyState = document.getElementById('usersEmptyState');
  const totalUsersCount = document.getElementById('totalUsersCount');
  const adminCount   = document.getElementById('adminCount');
  const tecnicoCount = document.getElementById('tecnicoCount');
  const clienteCount = document.getElementById('clienteCount');

  // Painel Técnico
  const tecnicoTicketsBody     = document.getElementById('tecnicoTicketsBody');
  const tecnicoStatPendentes   = document.getElementById('tecnicoStatPendentes');
  const tecnicoStatAtivos      = document.getElementById('tecnicoStatAtivos');
  const tecnicoStatConcluidos  = document.getElementById('tecnicoStatConcluidos');

  // Modais
  const openModalBtns      = document.querySelectorAll('.open-modal-btn');
  const closeModalBtn      = document.getElementById('closeModalBtn');
  const ticketModal        = document.getElementById('ticketModal');
  const ticketForm         = document.getElementById('ticketForm');
  const ticketDetailModal  = document.getElementById('ticketDetailModal');
  const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
  const ticketDetailBody   = document.getElementById('ticketDetailBody');

  // Botões de novos chamados
  const btnNewTicketDesktop = document.getElementById('btnNewTicketDesktop');
  const btnNewTicketMobile  = document.getElementById('btnNewTicketMobile');

  // Toasts
  const toastContainer = document.getElementById('toastContainer');

  // Overlay para fechar sidebar no mobile
  const drawerOverlay = document.createElement('div');
  drawerOverlay.className = 'modal-overlay';
  drawerOverlay.style.zIndex = '35';
  document.body.appendChild(drawerOverlay);


  // ─── SISTEMA DE TOASTS ──────────────────────────────────────

  /**
   * Exibe uma notificação toast na tela.
   * @param {string} message  - Mensagem a exibir
   * @param {'success'|'error'|'info'|'warning'} type - Tipo do toast
   * @param {number} duration - Duração em ms (padrão 4000)
   */
  const showToast = (message, type = 'info', duration = 4000) => {
    const icons = { success: 'check_circle', error: 'error', info: 'info', warning: 'warning' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="material-symbols-outlined">${icons[type] || 'info'}</span>
      <span>${escapeHTML(message)}</span>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hide');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, duration);
  };


  // ─── SISTEMA DE TEMAS ────────────────────────────────────────

  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') document.documentElement.classList.add('dark');

  const updateThemeIcon = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (themeToggle) themeToggle.querySelector('span').textContent = isDark ? 'light_mode' : 'dark_mode';
  };

  updateThemeIcon();

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      updateThemeIcon();
    });
  }


  // ─── CONTROLE DE SESSÃO (FIREBASE AUTH) ─────────────────────

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const perfil = await obterPerfilUsuario(user.uid);
        if (perfil) {
          userProfile = perfil;
          exibirAplicacao(user, perfil);
        } else {
          console.error("Perfil não encontrado no Firestore.");
          await logoutUsuario();
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        await logoutUsuario();
      }
    } else {
      userProfile = null;
      allTickets  = [];
      allUsers    = [];
      exibirAutenticacao();
    }
  });


  // ─── FLUXO DE AUTENTICAÇÃO ───────────────────────────────────

  const exibirAutenticacao = () => {
    authSection.classList.remove('hidden');
    appContainer.classList.add('hidden');
    loginForm.reset();
    registerForm.reset();
    passwordStrength.classList.add('hidden');
  };

  const exibirAplicacao = (user, perfil) => {
    authSection.classList.add('hidden');
    appContainer.classList.remove('hidden');
    configurarPerfil(perfil);
    configurarVisibilidadePorRole(perfil.role);
    atualizarDadosApp();
    mostrarSecao('dashboard');
  };

  // Alterna abas Login / Cadastro
  tabLoginBtn.addEventListener('click', () => {
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    authTitle.textContent    = 'Bem-vindo de volta';
    authSubtitle.textContent = 'Entre com suas credenciais para acessar o portal';
    if (authHeaderIcon) authHeaderIcon.textContent = 'lock';
  });

  tabRegisterBtn.addEventListener('click', () => {
    tabRegisterBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    authTitle.textContent    = 'Criar nova conta';
    authSubtitle.textContent = 'Preencha os dados abaixo para se cadastrar no portal';
    if (authHeaderIcon) authHeaderIcon.textContent = 'person_add';
  });

  // Submit de Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn      = document.getElementById('btnLoginSubmit');

    setButtonLoading(btn, true);
    try {
      await loginUsuario(email, password);
    } catch (error) {
      showToast('E-mail ou senha incorretos. Tente novamente.', 'error');
    } finally {
      setButtonLoading(btn, false);
    }
  });

  // Submit de Cadastro
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome     = document.getElementById('registerName').value.trim();
    const email    = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const terms    = document.getElementById('termsCheck');
    const btn      = document.getElementById('btnRegisterSubmit');

    if (!nome || !email || !password) {
      showToast('Preencha todos os campos obrigatórios.', 'warning'); return;
    }
    if (password.length < 6) {
      showToast('A senha deve ter pelo menos 6 caracteres.', 'warning'); return;
    }
    if (terms && !terms.checked) {
      showToast('Você deve aceitar os termos para se cadastrar.', 'warning'); return;
    }

    setButtonLoading(btn, true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "usuarios", user.uid), {
        nome,
        email,
        role: "CLIENTE",
        data_criacao: serverTimestamp()
      });

      showToast(`Conta criada com sucesso! Bem-vindo(a), ${nome}!`, 'success', 5000);
    } catch (error) {
      console.error("Erro no cadastro:", error);
      const msg = traduzirErroFirebase(error.code);
      showToast(msg, 'error');
      setButtonLoading(btn, false);
    }
  });

  // Exibir/ocultar senha
  const setupTogglePassword = (btnId, inputId) => {
    const btn   = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;
    btn.addEventListener('click', () => {
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      btn.querySelector('span').textContent = isHidden ? 'visibility_off' : 'visibility';
    });
  };

  setupTogglePassword('toggleLoginPass',    'loginPassword');
  setupTogglePassword('toggleRegisterPass', 'registerPassword');

  // Indicador de força da senha
  const passwordStrength = document.getElementById('passwordStrength');
  const strengthFill     = document.getElementById('strengthFill');
  const strengthLabel    = document.getElementById('strengthLabel');

  document.getElementById('registerPassword').addEventListener('input', (e) => {
    const val = e.target.value;
    if (!val) { passwordStrength.classList.add('hidden'); return; }
    passwordStrength.classList.remove('hidden');

    const score = calcPasswordStrength(val);
    const configs = [
      { pct: '25%', color: '#dc2626', label: 'Fraca' },
      { pct: '50%', color: '#f59e0b', label: 'Razoável' },
      { pct: '75%', color: '#3b82f6', label: 'Boa' },
      { pct: '100%', color: '#10b981', label: 'Forte' }
    ];
    const cfg = configs[Math.min(score - 1, 3)] || configs[0];
    strengthFill.style.width           = cfg.pct;
    strengthFill.style.backgroundColor = cfg.color;
    strengthLabel.textContent          = cfg.label;
    strengthLabel.style.color          = cfg.color;
  });

  const calcPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 6)  score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;
    return Math.max(score, 1);
  };

  // Link "Esqueci minha senha" — placeholder
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Funcionalidade em breve. Contate o administrador.', 'info');
    });
  }

  // Tradução de erros do Firebase
  const traduzirErroFirebase = (code) => {
    const erros = {
      'auth/email-already-in-use': 'Este e-mail já está cadastrado. Tente fazer login.',
      'auth/invalid-email':        'E-mail inválido. Verifique o formato.',
      'auth/weak-password':        'Senha muito fraca. Use pelo menos 6 caracteres.',
      'auth/user-not-found':       'Usuário não encontrado.',
      'auth/wrong-password':       'Senha incorreta. Tente novamente.',
      'auth/too-many-requests':    'Muitas tentativas. Aguarde um momento.',
      'auth/network-request-failed': 'Falha de rede. Verifique sua conexão.',
    };
    return erros[code] || 'Ocorreu um erro inesperado. Tente novamente.';
  };

  // Utilitário para estado de loading no botão
  const setButtonLoading = (btn, loading) => {
    if (!btn) return;
    const textEl   = btn.querySelector('.btn-text');
    const loaderEl = btn.querySelector('.btn-loader');
    btn.disabled = loading;
    if (textEl)   textEl.classList.toggle('hidden', loading);
    if (loaderEl) loaderEl.classList.toggle('hidden', !loading);
  };


  // ─── CONFIGURAÇÃO DE PERFIL NA SIDEBAR ──────────────────────

  const configurarPerfil = (perfil) => {
    const inicial = perfil.nome ? perfil.nome.charAt(0).toUpperCase() : '?';
    if (navAvatar) {
      navAvatar.innerHTML = inicial;
      navAvatar.style.background = gerarCorPorRole(perfil.role);
    }
    if (userDisplayName) userDisplayName.textContent = perfil.nome || 'Usuário';
    if (roleLabel) roleLabel.textContent = `Online • ${formatarRole(perfil.role)}`;

    // Badge de role na sidebar
    if (navRoleBadge) {
      const badgeClass = { ADMIN: 'badge-admin', TECNICO: 'badge-tecnico', CLIENTE: 'badge-cliente' }[perfil.role] || 'badge-cliente';
      navRoleBadge.innerHTML = `<span class="badge-role ${badgeClass}">${formatarRole(perfil.role)}</span>`;
    }

    // Welcome banner
    const hora = new Date().getHours();
    const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
    if (welcomeTitle)    welcomeTitle.textContent    = `${saudacao}, ${perfil.nome?.split(' ')[0]}! 👋`;
    if (welcomeSubtitle) welcomeSubtitle.textContent = mensagemPorRole(perfil.role);
  };

  const gerarCorPorRole = (role) => {
    const cores = {
      ADMIN:   'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
      TECNICO: 'linear-gradient(135deg, #1d6bf3 0%, #4f46e5 100%)',
      CLIENTE: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    };
    return cores[role] || cores.CLIENTE;
  };

  const mensagemPorRole = (role) => {
    const msgs = {
      ADMIN:   'Você tem acesso completo ao sistema. Gerencie usuários e chamados.',
      TECNICO: 'Sua fila de chamados está pronta. Atenda com eficiência!',
      CLIENTE: 'Acompanhe seus chamados ou abra um novo quando precisar.'
    };
    return msgs[role] || 'Acesse o painel de chamados.';
  };

  const formatarRole = (role) => {
    const roles = { ADMIN: 'Administrador', TECNICO: 'Suporte Técnico', CLIENTE: 'Cliente' };
    return roles[role] || role;
  };


  // ─── CONTROLE DE VISIBILIDADE POR ROLE (RBAC) ───────────────

  const configurarVisibilidadePorRole = (role) => {
    // Elementos de Admin
    adminOnlyElements.forEach(el => {
      el.classList.toggle('hidden', role !== 'ADMIN');
    });

    // Elementos de Técnico e Admin
    tecnicoAdminOnlyElements.forEach(el => {
      el.classList.toggle('hidden', role === 'CLIENTE');
    });

    // Botão de novo chamado — Técnicos não abrem chamados
    const hideBtnTicket = role === 'TECNICO';
    if (btnNewTicketDesktop) btnNewTicketDesktop.classList.toggle('hidden', hideBtnTicket);
    if (btnNewTicketMobile)  btnNewTicketMobile.classList.toggle('hidden', hideBtnTicket);

    // Título da tabela de chamados
    if (ticketsTableTitle) {
      ticketsTableTitle.textContent = role === 'CLIENTE' ? 'Meus Chamados' : 'Chamados Recentes';
    }
  };


  // ─── CARREGAMENTO E ATUALIZAÇÃO DE DADOS ────────────────────

  const atualizarDadosApp = async () => {
    if (!auth.currentUser || !userProfile) return;
    try {
      allTickets = await listarChamadosPorPerfil(userProfile.role, auth.currentUser.uid);
      updateKPIs();
      renderTickets();
      atualizarBadgePendentes();

      if (currentSection === 'admin' && userProfile.role === 'ADMIN') {
        await carregarListaUsuariosAdmin();
      }
      if (currentSection === 'meus-chamados') {
        renderTecnicoPanel();
      }
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      showToast('Falha ao carregar dados. Verifique sua conexão.', 'error');
    }
  };

  // Atualiza o badge de chamados pendentes na sidebar
  const atualizarBadgePendentes = () => {
    if (!navBadgePendentes) return;
    const pendentes = allTickets.filter(t => t.status === 'Pendente').length;
    if (pendentes > 0) {
      navBadgePendentes.textContent = pendentes > 99 ? '99+' : String(pendentes);
      navBadgePendentes.style.display = 'inline-flex';
    } else {
      navBadgePendentes.style.display = 'none';
    }
  };

  // Botão de recarregar
  if (btnRefresh) {
    btnRefresh.addEventListener('click', async () => {
      btnRefresh.querySelector('span').style.animation = 'spin 0.6s linear';
      await atualizarDadosApp();
      showToast('Dados atualizados com sucesso!', 'success', 2500);
      setTimeout(() => {
        if (btnRefresh.querySelector('span')) {
          btnRefresh.querySelector('span').style.animation = '';
        }
      }, 600);
    });
  }


  // ─── NAVEGAÇÃO SPA ──────────────────────────────────────────

  const SPA_SECTIONS = {
    'dashboard':     { el: dashboardContent,  title: 'Painel Geral',       navId: 'nav-dashboard',    mobileId: 'mobile-nav-home'  },
    'meus-chamados': { el: tecnicoContent,     title: 'Meus Chamados',      navId: 'nav-meus-chamados', mobileId: 'mobile-nav-meus' },
    'admin':         { el: adminUsersContent,  title: 'Gerenciar Usuários', navId: 'nav-users',        mobileId: 'mobile-nav-users' },
  };

  const mostrarSecao = (secao) => {
    currentSection = secao;
    const cfg = SPA_SECTIONS[secao];
    if (!cfg) return;

    // Esconder todas as seções
    Object.values(SPA_SECTIONS).forEach(s => s.el?.classList.add('hidden'));

    // Exibir a seção alvo
    cfg.el?.classList.remove('hidden');

    // Atualizar título da página
    if (pageTitle) pageTitle.textContent = cfg.title;

    // Atualizar links ativos — Desktop
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeNavLink = document.getElementById(cfg.navId);
    if (activeNavLink) activeNavLink.classList.add('active');

    // Atualizar links ativos — Mobile
    document.querySelectorAll('.bottom-nav-link').forEach(l => l.classList.remove('active'));
    const activeMobileLink = document.getElementById(cfg.mobileId);
    if (activeMobileLink) activeMobileLink.classList.add('active');

    fecharMenuMobile();

    // Carregar dados específicos da seção
    if (secao === 'admin' && userProfile?.role === 'ADMIN') {
      carregarListaUsuariosAdmin();
    }
    if (secao === 'meus-chamados') {
      renderTecnicoPanel();
    }
  };

  // Bindings de navegação — Desktop
  navDashboard?.addEventListener('click',    e => { e.preventDefault(); mostrarSecao('dashboard'); });
  navMeusChamados?.addEventListener('click', e => { e.preventDefault(); mostrarSecao('meus-chamados'); });
  navUsers?.addEventListener('click',        e => { e.preventDefault(); mostrarSecao('admin'); });
  navLogout?.addEventListener('click',       async e => { e.preventDefault(); await logoutUsuario(); });

  // Bindings de navegação — Mobile
  mobileNavHome?.addEventListener('click',   e => { e.preventDefault(); mostrarSecao('dashboard'); });
  mobileNavMeus?.addEventListener('click',   e => { e.preventDefault(); mostrarSecao('meus-chamados'); });
  mobileNavUsers?.addEventListener('click',  e => { e.preventDefault(); mostrarSecao('admin'); });
  mobileNavLogout?.addEventListener('click', async e => { e.preventDefault(); await logoutUsuario(); });


  // ─── SIDEBAR MOBILE ──────────────────────────────────────────

  const fecharMenuMobile = () => {
    navDrawer?.classList.remove('active');
    drawerOverlay.classList.remove('active');
  };

  menuToggle?.addEventListener('click', () => {
    navDrawer?.classList.add('active');
    drawerOverlay.classList.add('active');
  });

  drawerOverlay.addEventListener('click', fecharMenuMobile);


  // ─── KPIs ────────────────────────────────────────────────────

  const updateKPIs = () => {
    const counts = { opened: 0, inProgress: 0, waiting: 0, completed: 0 };
    allTickets.forEach(ticket => {
      if      (ticket.status === 'Pendente')    counts.opened++;
      else if (ticket.status === 'Em Progresso') counts.inProgress++;
      else if (ticket.status === 'Validando')   counts.waiting++;
      else if (ticket.status === 'Concluído')   counts.completed++;
    });

    animateCounter('kpi-abertos',     counts.opened);
    animateCounter('kpi-atendimento', counts.inProgress);
    animateCounter('kpi-aguardando',  counts.waiting);
    animateCounter('kpi-concluidos',  counts.completed);
  };

  // Animação de contador numérico
  const animateCounter = (id, target) => {
    const el = document.getElementById(id);
    if (!el) return;
    const start    = parseInt(el.textContent) || 0;
    const duration = 600;
    const startTime = performance.now();

    const update = (now) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(start + (target - start) * eased);
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  };


  // ─── TABELA DE CHAMADOS ───────────────────────────────────────

  const renderTickets = () => {
    if (!ticketsBody) return;
    ticketsBody.innerHTML = '';

    const filtered = allTickets.filter(t =>
      currentCategoryFilter === 'all' ||
      t.categoria?.toLowerCase() === currentCategoryFilter.toLowerCase() ||
      t.category?.toLowerCase() === currentCategoryFilter.toLowerCase()
    );

    if (filtered.length === 0) {
      tableEmptyState?.classList.remove('hidden');
      return;
    }
    tableEmptyState?.classList.add('hidden');

    filtered.forEach(ticket => {
      const tr = document.createElement('tr');
      const prioClass = mapPriorityClass(ticket.prioridade);
      const cat = ticket.categoria || ticket.category || '—';

      tr.innerHTML = `
        <td>
          <div class="ticket-title-cell">
            <div class="ticket-prio-bar ${prioClass}"></div>
            <div class="ticket-title-info">
              <span class="ticket-title">${escapeHTML(ticket.assunto)}</span>
              <span class="ticket-id">#${escapeHTML(ticket.ticket_code || ticket.id?.slice(0,8) || '—')}</span>
            </div>
          </div>
        </td>
        <td><span class="category-badge">${escapeHTML(cat)}</span></td>
        <td><span class="chip-priority ${prioClass}">${escapeHTML(ticket.prioridade || '—')}</span></td>
        <td><span class="status-label ${mapStatusClass(ticket.status)}">${escapeHTML(ticket.status || '—')}</span></td>
        <td>
          <div class="actions-cell-wrapper">
            <button class="btn-icon-action view-btn" data-id="${ticket.id}" title="Ver detalhes">
              <span class="material-symbols-outlined">visibility</span>
            </button>
            ${renderBotoesAcao(ticket)}
          </div>
        </td>
      `;
      ticketsBody.appendChild(tr);
    });

    bindTableActions(ticketsBody);
  };

  // ─── PAINEL DO TÉCNICO ────────────────────────────────────────

  const renderTecnicoPanel = () => {
    if (!tecnicoTicketsBody || !userProfile) return;
    tecnicoTicketsBody.innerHTML = '';

    const uid = auth.currentUser?.uid;
    const meus = allTickets.filter(t =>
      t.tecnico_id === uid || t.status === 'Pendente' || !t.tecnico_id
    );

    const pend = meus.filter(t => t.status === 'Pendente').length;
    const ativos = meus.filter(t => t.status === 'Em Progresso').length;
    const conc   = meus.filter(t => t.status === 'Concluído').length;

    if (tecnicoStatPendentes)  tecnicoStatPendentes.textContent  = pend;
    if (tecnicoStatAtivos)     tecnicoStatAtivos.textContent     = ativos;
    if (tecnicoStatConcluidos) tecnicoStatConcluidos.textContent = conc;

    if (meus.length === 0) {
      tecnicoTicketsBody.innerHTML = `
        <tr><td colspan="5" style="text-align:center;padding:32px;color:var(--on-surface-variant);">
          Nenhum chamado em sua fila no momento.
        </td></tr>`;
      return;
    }

    meus.forEach(ticket => {
      const tr = document.createElement('tr');
      const prioClass = mapPriorityClass(ticket.prioridade);
      const cat = ticket.categoria || ticket.category || '—';

      tr.innerHTML = `
        <td>
          <div class="ticket-title-cell">
            <div class="ticket-prio-bar ${prioClass}"></div>
            <div class="ticket-title-info">
              <span class="ticket-title">${escapeHTML(ticket.assunto)}</span>
              <span class="ticket-id">#${escapeHTML(ticket.ticket_code || ticket.id?.slice(0,8) || '—')}</span>
            </div>
          </div>
        </td>
        <td><span class="category-badge">${escapeHTML(cat)}</span></td>
        <td><span class="chip-priority ${prioClass}">${escapeHTML(ticket.prioridade || '—')}</span></td>
        <td><span class="status-label ${mapStatusClass(ticket.status)}">${escapeHTML(ticket.status || '—')}</span></td>
        <td>
          <div class="actions-cell-wrapper">
            <button class="btn-icon-action view-btn" data-id="${ticket.id}" title="Ver detalhes">
              <span class="material-symbols-outlined">visibility</span>
            </button>
            ${renderBotoesAcao(ticket)}
          </div>
        </td>
      `;
      tecnicoTicketsBody.appendChild(tr);
    });

    bindTableActions(tecnicoTicketsBody);
  };


  // ─── BOTÕES DE AÇÃO POR ROLE ─────────────────────────────────

  const renderBotoesAcao = (ticket) => {
    if (!userProfile) return '';

    if (userProfile.role === 'ADMIN' || userProfile.role === 'TECNICO') {
      const uid = auth.currentUser?.uid;
      if (ticket.status === 'Pendente') {
        return `<button class="btn-small-action assign-btn" data-id="${ticket.id}" title="Atribuir a mim">Atribuir</button>`;
      }
      if (ticket.status === 'Em Progresso' &&
          (ticket.tecnico_id === uid || userProfile.role === 'ADMIN')) {
        return `<button class="btn-small-action resolve-btn" data-id="${ticket.id}" title="Concluir chamado">Concluir</button>`;
      }
    }
    return '';
  };

  // Vincula eventos de ação a uma tabela específica
  const bindTableActions = (tbody) => {
    tbody.querySelectorAll('.assign-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id  = e.currentTarget.dataset.id;
        const uid = auth.currentUser?.uid;
        btn.disabled = true;
        btn.textContent = '...';
        try {
          await atualizarChamado(id, "Em Progresso", uid, `Chamado atribuído ao técnico: ${userProfile.nome}`);
          showToast('Chamado atribuído com sucesso!', 'success');
          await atualizarDadosApp();
        } catch {
          showToast('Erro ao atribuir chamado. Verifique as permissões.', 'error');
          btn.disabled = false;
          btn.textContent = 'Atribuir';
        }
      });
    });

    tbody.querySelectorAll('.resolve-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id     = e.currentTarget.dataset.id;
        const ticket = allTickets.find(t => t.id === id);
        if (!ticket) return;
        btn.disabled = true;
        btn.textContent = '...';
        try {
          await atualizarChamado(id, "Concluído", ticket.tecnico_id, `Chamado resolvido e concluído.`);
          showToast('Chamado concluído com sucesso!', 'success');
          await atualizarDadosApp();
        } catch {
          showToast('Erro ao concluir chamado. Sem permissão.', 'error');
          btn.disabled = false;
          btn.textContent = 'Concluir';
        }
      });
    });

    tbody.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id     = e.currentTarget.dataset.id;
        const ticket = allTickets.find(t => t.id === id);
        if (ticket) abrirModalDetalhes(ticket);
      });
    });
  };


  // ─── FILTROS DE CATEGORIA ─────────────────────────────────────

  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterButtons.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      currentCategoryFilter = e.currentTarget.dataset.category;
      renderTickets();
    });
  });


  // ─── MODAL — NOVO CHAMADO ────────────────────────────────────

  const openModal = () => ticketModal?.classList.add('active');
  const closeModal = () => {
    ticketModal?.classList.remove('active');
    ticketForm?.reset();
  };

  openModalBtns.forEach(btn => btn.addEventListener('click', openModal));
  closeModalBtn?.addEventListener('click', closeModal);
  ticketModal?.addEventListener('click', e => { if (e.target === ticketModal) closeModal(); });

  ticketForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const assunto  = document.getElementById('ticketTitle').value.trim();
    const category = document.getElementById('ticketCategory').value;
    const priority = document.getElementById('ticketPriority').value;
    const desc     = document.getElementById('ticketDesc').value.trim();

    if (!assunto) { showToast('Informe um título para o chamado.', 'warning'); return; }

    const btnSave = document.getElementById('btnSaveTicket');
    btnSave.disabled = true;
    const originalHtml = btnSave.innerHTML;
    btnSave.innerHTML = '<span class="spinner" style="border-color:rgba(255,255,255,0.3);border-top-color:#fff;width:14px;height:14px;display:inline-block;"></span> Salvando...';

    try {
      await criarChamado({ assunto, categoria: category, prioridade: priority, descricao: desc });
      closeModal();
      await atualizarDadosApp();
      showToast(`Chamado "${assunto}" aberto com sucesso!`, 'success');
    } catch (err) {
      console.error("Erro ao criar chamado:", err);
      showToast('Erro ao abrir o chamado. Tente novamente.', 'error');
    } finally {
      btnSave.disabled = false;
      btnSave.innerHTML = originalHtml;
    }
  });


  // ─── MODAL — DETALHES DO CHAMADO ─────────────────────────────

  const abrirModalDetalhes = (ticket) => {
    if (!ticketDetailModal || !ticketDetailBody) return;
    const cat    = ticket.categoria || ticket.category || '—';
    const prioClass = mapPriorityClass(ticket.prioridade);
    const statClass = mapStatusClass(ticket.status);
    const criacao = ticket.data_criacao?.toDate
      ? ticket.data_criacao.toDate().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
      : '—';
    const atualizacao = ticket.data_atualizacao?.toDate
      ? ticket.data_atualizacao.toDate().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
      : '—';

    ticketDetailBody.innerHTML = `
      <div class="ticket-detail-grid">
        <div class="ticket-detail-item">
          <span class="ticket-detail-label">Código</span>
          <span class="ticket-detail-value" style="font-family:monospace;font-weight:700;">#${escapeHTML(ticket.ticket_code || ticket.id?.slice(0,8) || '—')}</span>
        </div>
        <div class="ticket-detail-item">
          <span class="ticket-detail-label">Categoria</span>
          <span class="ticket-detail-value">${escapeHTML(cat)}</span>
        </div>
        <div class="ticket-detail-item full-width">
          <span class="ticket-detail-label">Título</span>
          <span class="ticket-detail-value" style="font-size:16px;font-weight:700;">${escapeHTML(ticket.assunto)}</span>
        </div>
        <hr class="ticket-detail-divider">
        <div class="ticket-detail-item">
          <span class="ticket-detail-label">Prioridade</span>
          <span class="chip-priority ${prioClass}" style="margin-top:2px;">${escapeHTML(ticket.prioridade || '—')}</span>
        </div>
        <div class="ticket-detail-item">
          <span class="ticket-detail-label">Status</span>
          <span class="status-label ${statClass}" style="margin-top:2px;">${escapeHTML(ticket.status || '—')}</span>
        </div>
        <div class="ticket-detail-item">
          <span class="ticket-detail-label">Abertura</span>
          <span class="ticket-detail-value">${criacao}</span>
        </div>
        <div class="ticket-detail-item">
          <span class="ticket-detail-label">Última atualização</span>
          <span class="ticket-detail-value">${atualizacao}</span>
        </div>
        ${ticket.descricao ? `
        <hr class="ticket-detail-divider">
        <div class="ticket-detail-item full-width">
          <span class="ticket-detail-label">Descrição</span>
          <span class="ticket-detail-value" style="white-space:pre-wrap;line-height:1.7;">${escapeHTML(ticket.descricao)}</span>
        </div>` : ''}
        ${ticket.tecnico_id ? `
        <hr class="ticket-detail-divider">
        <div class="ticket-detail-item full-width">
          <span class="ticket-detail-label">Técnico Responsável</span>
          <span class="ticket-detail-value" style="display:flex;align-items:center;gap:6px;">
            <span class="material-symbols-outlined" style="font-size:16px;color:var(--secondary);">engineering</span>
            Técnico atribuído (ID: ${ticket.tecnico_id.slice(0,8)}...)
          </span>
        </div>` : ''}
      </div>
    `;

    ticketDetailModal.classList.add('active');
  };

  closeDetailModalBtn?.addEventListener('click', () => ticketDetailModal?.classList.remove('active'));
  ticketDetailModal?.addEventListener('click', e => {
    if (e.target === ticketDetailModal) ticketDetailModal.classList.remove('active');
  });


  // ─── GERENCIAMENTO DE USUÁRIOS (ADMIN) ───────────────────────

  const carregarListaUsuariosAdmin = async () => {
    if (!usersTableBody || userProfile?.role !== 'ADMIN') return;
    usersTableBody.innerHTML = `
      <tr><td colspan="4" style="text-align:center;padding:32px;color:var(--on-surface-variant);">
        <span class="spinner" style="display:inline-block;width:20px;height:20px;border-width:2px;"></span>
        Carregando usuários...
      </td></tr>`;

    try {
      const snapshot = await getDocs(collection(db, "usuarios"));
      allUsers = [];
      snapshot.forEach(d => allUsers.push({ id: d.id, ...d.data() }));
      renderUsersTable(allUsers);
      atualizarContadoresAdmin(allUsers);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      usersTableBody.innerHTML = `
        <tr><td colspan="4" style="text-align:center;padding:24px;color:var(--error);">
          Falha ao carregar usuários. Verifique as permissões.
        </td></tr>`;
    }
  };

  const atualizarContadoresAdmin = (users) => {
    if (totalUsersCount) totalUsersCount.textContent = `${users.length} usuário${users.length !== 1 ? 's' : ''}`;
    if (adminCount)   adminCount.textContent   = users.filter(u => u.role === 'ADMIN').length;
    if (tecnicoCount) tecnicoCount.textContent = users.filter(u => u.role === 'TECNICO').length;
    if (clienteCount) clienteCount.textContent = users.filter(u => u.role === 'CLIENTE').length;
  };

  const renderUsersTable = (users) => {
    if (!usersTableBody) return;
    usersTableBody.innerHTML = '';

    if (users.length === 0) {
      usersEmptyState?.classList.remove('hidden');
      return;
    }
    usersEmptyState?.classList.add('hidden');

    users.forEach(userData => {
      const userId    = userData.id;
      const badgeClass = { ADMIN: 'badge-admin', TECNICO: 'badge-tecnico', CLIENTE: 'badge-cliente' }[userData.role] || 'badge-cliente';
      const inicial   = userData.nome?.charAt(0)?.toUpperCase() || '?';
      const isSelf    = userId === auth.currentUser?.uid;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="
              width:34px;height:34px;border-radius:50%;
              background:${gerarCorPorRole(userData.role)};
              color:#fff;display:flex;align-items:center;justify-content:center;
              font-weight:700;font-size:14px;flex-shrink:0;
            ">${inicial}</div>
            <div style="display:flex;flex-direction:column;gap:2px;">
              <strong style="font-size:13px;">${escapeHTML(userData.nome || '—')}${isSelf ? ' <span style="font-size:10px;font-weight:600;color:var(--secondary);">(você)</span>' : ''}</strong>
              <span class="badge-role ${badgeClass}">${userData.role}</span>
            </div>
          </div>
        </td>
        <td style="font-size:13px;color:var(--on-surface-variant);">${escapeHTML(userData.email || '—')}</td>
        <td><span class="badge-role ${badgeClass}">${formatarRole(userData.role)}</span></td>
        <td style="text-align:right;">
          <select class="role-select" data-uid="${userId}" ${isSelf ? 'disabled title="Você não pode alterar sua própria role"' : ''}>
            <option value="CLIENTE"  ${userData.role === 'CLIENTE'  ? 'selected' : ''}>👤 Cliente</option>
            <option value="TECNICO"  ${userData.role === 'TECNICO'  ? 'selected' : ''}>🔧 Técnico</option>
            <option value="ADMIN"    ${userData.role === 'ADMIN'    ? 'selected' : ''}>🛡️ Admin</option>
          </select>
        </td>
      `;
      usersTableBody.appendChild(tr);
    });

    // Evento de alteração de Role
    usersTableBody.querySelectorAll('.role-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const uid      = e.target.dataset.uid;
        const novaRole = e.target.value;
        const oldRole  = allUsers.find(u => u.id === uid)?.role;
        const nomeUser = allUsers.find(u => u.id === uid)?.nome || 'Usuário';

        select.disabled = true;
        try {
          await updateDoc(doc(db, "usuarios", uid), { role: novaRole });
          showToast(`Perfil de ${nomeUser} alterado para ${formatarRole(novaRole)}!`, 'success');

          // Recarregar lista
          const idx = allUsers.findIndex(u => u.id === uid);
          if (idx !== -1) allUsers[idx].role = novaRole;
          atualizarContadoresAdmin(allUsers);
          renderUsersTable(filteredUsersList());

          if (uid === auth.currentUser?.uid) {
            showToast('Sua própria role foi alterada. Recarregando...', 'info', 3000);
            setTimeout(() => window.location.reload(), 3000);
          }
        } catch (err) {
          console.error("Erro ao alterar role:", err);
          showToast('Erro ao atualizar permissão. Verifique as regras de segurança.', 'error');
          e.target.value = oldRole;
        } finally {
          select.disabled = false;
        }
      });
    });
  };

  // Filtro de busca de usuários
  const filteredUsersList = () => {
    const query = userSearchInput?.value.trim().toLowerCase() || '';
    if (!query) return allUsers;
    return allUsers.filter(u =>
      (u.nome?.toLowerCase().includes(query)) ||
      (u.email?.toLowerCase().includes(query))
    );
  };

  userSearchInput?.addEventListener('input', () => {
    renderUsersTable(filteredUsersList());
  });


  // ─── HELPERS ─────────────────────────────────────────────────

  const mapPriorityClass = (priority) => {
    const map = { 'Crítica': 'critical', 'Alta': 'high', 'Média': 'medium', 'Baixa': 'low' };
    return map[priority] || 'low';
  };

  const mapStatusClass = (status) => {
    const map = { 'Pendente': 'pending', 'Em Progresso': 'in-progress', 'Validando': 'validating', 'Concluído': 'resolved' };
    return map[status] || 'pending';
  };

  const escapeHTML = (str) => {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g,
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  };

}); // fim DOMContentLoaded
