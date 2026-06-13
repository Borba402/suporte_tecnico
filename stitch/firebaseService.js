import { 
  signInWithEmailAndPassword, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  collection, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  or,
  runTransaction,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { auth, db } from "./firebaseConfig.js";

/**
 * Realiza o login do usuário com e-mail e senha.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export async function loginUsuario(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    throw error;
  }
}

/**
 * Realiza o logout do usuário atual.
 */
export async function logoutUsuario() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    throw error;
  }
}

/**
 * Obtém os dados do perfil do usuário e sua Role a partir do Firestore.
 * @param {string} uid ID do usuário autenticado no Firebase Auth
 * @returns {Promise<{nome: string, email: string, role: 'ADMIN' | 'TECNICO' | 'CLIENTE'}|null>}
 */
export async function obterPerfilUsuario(uid) {
  try {
    const userDocRef = doc(db, "usuarios", uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return userDocSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Erro ao obter perfil do usuário:", error);
    throw error;
  }
}

/**
 * Cria um novo chamado técnico utilizando transação para garantir que a inserção do chamado 
 * e a gravação do registro de auditoria no histórico ocorram de forma atômica.
 * @param {Object} chamadoDados Dados do chamado
 * @param {string} chamadoDados.assunto
 * @param {string} chamadoDados.descricao
 * @param {string} chamadoDados.categoria
 * @param {string} chamadoDados.prioridade
 * @returns {Promise<string>} O ID do chamado recém-criado
 */
export async function criarChamado(chamadoDados) {
  const usuario = auth.currentUser;
  if (!usuario) {
    throw new Error("Usuário precisa estar autenticado para abrir um chamado.");
  }

  const { assunto, descricao, categoria, prioridade } = chamadoDados;

  // Gerar código único do ticket (Ex: TK-2026-XXXX)
  const ticketCode = `TK-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    const chamadosColRef = collection(db, "chamados");
    const historicoColRef = collection(db, "historico_chamados");

    // Executando como transação atômica
    const chamadoId = await runTransaction(db, async (transaction) => {
      // Cria a referência para o novo documento de chamado
      const novoChamadoRef = doc(chamadosColRef);

      const novoChamado = {
        ticket_code: ticketCode,
        assunto,
        descricao,
        categoria,
        prioridade,
        status: "Pendente",
        cliente_id: usuario.uid,
        tecnico_id: null,
        data_criacao: serverTimestamp(),
        data_atualizacao: serverTimestamp()
      };

      // Grava o documento do chamado
      transaction.set(novoChamadoRef, novoChamado);

      // Cria a referência para o registro de auditoria no histórico
      const novoHistoricoRef = doc(historicoColRef);
      const historicoRegistro = {
        chamado_id: novoChamadoRef.id,
        usuario_id: usuario.uid,
        acao_realizada: `Chamado aberto pelo cliente. Ticket gerado: ${ticketCode}`,
        timestamp: serverTimestamp()
      };

      // Grava o log de auditoria
      transaction.set(novoHistoricoRef, historicoRegistro);

      return novoChamadoRef.id;
    });

    return chamadoId;
  } catch (error) {
    console.error("Erro ao criar chamado (Transação):", error);
    throw error;
  }
}

/**
 * Atualiza o status de um chamado ou atribui um técnico.
 * @param {string} chamadoId ID do documento do chamado
 * @param {string} novoStatus Novo status (ex: 'Em Progresso', 'Concluído')
 * @param {string|null} tecnicoId ID do técnico atribuído ou null
 * @param {string} acaoDescricao Descrição detalhada da alteração para histórico
 */
export async function atualizarChamado(chamadoId, novoStatus, tecnicoId, acaoDescricao) {
  const usuario = auth.currentUser;
  if (!usuario) {
    throw new Error("Usuário precisa estar autenticado.");
  }

  try {
    const chamadoRef = doc(db, "chamados", chamadoId);
    const historicoColRef = collection(db, "historico_chamados");

    await runTransaction(db, async (transaction) => {
      // Atualiza o chamado
      transaction.update(chamadoRef, {
        status: novoStatus,
        tecnico_id: tecnicoId,
        data_atualizacao: serverTimestamp()
      });

      // Cria o registro no histórico de auditoria
      const novoHistoricoRef = doc(historicoColRef);
      transaction.set(novoHistoricoRef, {
        chamado_id: chamadoId,
        usuario_id: usuario.uid,
        acao_realizada: acaoDescricao,
        timestamp: serverTimestamp()
      });
    });
  } catch (error) {
    console.error("Erro ao atualizar chamado:", error);
    throw error;
  }
}

/**
 * Consulta estruturada de chamados com base na Role (Perfil) do usuário no Firestore.
 * Implica em controle granular onde:
 * - CLIENTE vê apenas os seus chamados.
 * - TECNICO vê os chamados atribuídos a eles ou sem técnico atribuído (tecnico_id == null).
 * - ADMIN vê todos os chamados cadastrados.
 * 
 * @param {string} role Perfil do usuário logado ('ADMIN' | 'TECNICO' | 'CLIENTE')
 * @param {string} uid ID do usuário atual logado
 * @returns {Promise<Array<Object>>} Lista de chamados encontrados
 */
export async function listarChamadosPorPerfil(role, uid) {
  try {
    const chamadosCol = collection(db, "chamados");
    let q;

    if (role === "CLIENTE") {
      // Clientes veem apenas seus próprios chamados
      q = query(
        chamadosCol,
        where("cliente_id", "==", uid),
        orderBy("data_criacao", "desc")
      );
    } else if (role === "TECNICO") {
      // Técnicos veem chamados atribuídos a eles ou não atribuídos (tecnico_id == null)
      q = query(
        chamadosCol,
        or(
          where("tecnico_id", "==", uid),
          where("tecnico_id", "==", null)
        ),
        orderBy("data_criacao", "desc")
      );
    } else if (role === "ADMIN") {
      // Administradores veem todos os chamados do sistema
      q = query(
        chamadosCol,
        orderBy("data_criacao", "desc")
      );
    } else {
      throw new Error(`Papel não identificado: ${role}`);
    }

    const querySnapshot = await getDocs(q);
    const chamados = [];
    querySnapshot.forEach((doc) => {
      chamados.push({ id: doc.id, ...doc.data() });
    });

    return chamados;
  } catch (error) {
    console.error("Erro ao listar chamados:", error);
    throw error;
  }
}
