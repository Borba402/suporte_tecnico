# Guia de Integração Firebase — Sistema de Suporte Técnico

Este documento descreve a arquitetura NoSQL, as regras de segurança refinadas (RBAC), a inicialização do SDK e as funções de integração front-end para o sistema de Suporte Técnico utilizando o **Google Firebase (Auth & Cloud Firestore)**.

---

## 1. Arquitetura NoSQL e Modelagem de Dados

Para atender aos requisitos de desempenho e escalabilidade do Firestore, os dados são divididos em três coleções principais. Abaixo estão as estruturas sugeridas representadas em formato JSON explicativo:

### Coleção: `usuarios`
* Cada documento utiliza como ID o `uid` único do usuário gerado pelo Firebase Auth no momento do cadastro.
```json
{
  "nome": "Ana Souza",
  "email": "ana.souza@empresa.com",
  "role": "CLIENTE", // Valores possíveis: "ADMIN" | "TECNICO" | "CLIENTE"
  "data_criacao": "2026-06-13T18:00:00Z"
}
```

### Coleção: `chamados`
* Contém os dados dos tickets de suporte abertos. O técnico e o cliente são referenciados por seus IDs únicos (`uid`).
```json
{
  "ticket_code": "TK-2026-8941",
  "assunto": "Instabilidade na Rede Local",
  "descricao": "Conexão caindo repetidamente no setor de faturamento.",
  "categoria": "Telecom", // Categorias: TI, Elétrica, Predial, Segurança, Telecom
  "prioridade": "Alta",   // Níveis: Baixa, Média, Alta
  "status": "Em Progresso", // Status: Pendente, Em Progresso, Concluído
  "cliente_id": "usr_client_xyz123", // Referência ao UID na coleção usuarios
  "tecnico_id": "usr_tecnico_abc456", // UID do técnico atribuído ou null (se sem técnico)
  "data_criacao": "2026-06-13T18:05:00Z", // Server Timestamp
  "data_atualizacao": "2026-06-13T18:15:00Z" // Server Timestamp
}
```

### Coleção: `historico_chamados`
* Documentos de auditoria atômica gerados em toda criação ou alteração de chamados, fornecendo logs de segurança.
```json
{
  "chamado_id": "chm_ticket_998877", // ID do documento na coleção chamados
  "usuario_id": "usr_tecnico_abc456", // Quem executou a ação
  "acao_realizada": "Técnico aceitou o chamado e alterou o status para Em Progresso",
  "timestamp": "2026-06-13T18:15:00Z" // Server Timestamp
}
```

---

## 2. Firestore Security Rules (firestore.rules)

Cole o código a seguir na aba **Rules (Regras)** do console do seu Cloud Firestore. Ele garante o isolamento completo de dados com base nas funções (`role`) dos usuários logados, impedindo adulterações ou leituras maliciosas.

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // -------------------------------------------------------------
    // FUNÇÕES AUXILIARES DE SEGURANÇA
    // -------------------------------------------------------------
    
    function isSignedIn() {
      return request.auth != null;
    }

    function getUserDoc() {
      return get(/databases/$(database)/documents/usuarios/$(request.auth.uid));
    }

    function getUserRole() {
      return getUserDoc().data.role;
    }

    function isAdmin() {
      return isSignedIn() && exists(/databases/$(database)/documents/usuarios/$(request.auth.uid)) && getUserRole() == 'ADMIN';
    }

    function isTecnico() {
      return isSignedIn() && exists(/databases/$(database)/documents/usuarios/$(request.auth.uid)) && getUserRole() == 'TECNICO';
    }

    function isCliente() {
      return isSignedIn() && exists(/databases/$(database)/documents/usuarios/$(request.auth.uid)) && getUserRole() == 'CLIENTE';
    }

    // -------------------------------------------------------------
    // COLEÇÃO: usuarios
    // -------------------------------------------------------------
    match /usuarios/{userId} {
      allow read, write: if isSignedIn() && request.auth.uid == userId;
      allow create, update, delete: if isAdmin();
      allow read: if isTecnico() || isAdmin();
    }

    // -------------------------------------------------------------
    // COLEÇÃO: chamados
    // -------------------------------------------------------------
    match /chamados/{chamadoId} {
      allow read: if isSignedIn() && (
        isAdmin() || 
        (isCliente() && resource.data.cliente_id == request.auth.uid) ||
        (isTecnico() && (resource.data.tecnico_id == request.auth.uid || resource.data.tecnico_id == null))
      );

      allow create: if isSignedIn() && (
        isAdmin() ||
        (isCliente() && request.resource.data.cliente_id == request.auth.uid)
      );

      allow update: if isSignedIn() && (
        isAdmin() ||
        (isTecnico() && 
          (resource.data.tecnico_id == request.auth.uid || resource.data.tecnico_id == null) &&
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'tecnico_id', 'data_atualizacao'])
        )
      );

      allow delete: if isAdmin();
    }

    // -------------------------------------------------------------
    // COLEÇÃO: historico_chamados
    // -------------------------------------------------------------
    match /historico_chamados/{historicoId} {
      allow read: if isSignedIn() && (
        isAdmin() ||
        isTecnico() ||
        (isCliente() && get(/databases/$(database)/documents/chamados/$(resource.data.chamado_id)).data.cliente_id == request.auth.uid)
      );

      allow create: if isSignedIn() && (
        isAdmin() ||
        isTecnico() ||
        (isCliente() && request.resource.data.usuario_id == request.auth.uid && 
          get(/databases/$(database)/documents/chamados/$(request.resource.data.chamado_id)).data.cliente_id == request.auth.uid)
      );

      allow update, delete: if isAdmin();
    }

  }
}
```

---

## 3. Código de Inicialização (firebaseConfig.js)

Esse arquivo inicializa o Firebase App e os serviços do Auth e Firestore no seu frontend React, usando variáveis de ambiente com fallback seguro:

```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: typeof process !== "undefined" && process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCkIq3bjPck-UUT2tWZm8nEAHNQd_bWS7I",
  authDomain: typeof process !== "undefined" && process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "suportetecnico-825a7.firebaseapp.com",
  projectId: typeof process !== "undefined" && process.env.REACT_APP_FIREBASE_PROJECT_ID || "suportetecnico-825a7",
  storageBucket: typeof process !== "undefined" && process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "suportetecnico-825a7.firebasestorage.app",
  messagingSenderId: typeof process !== "undefined" && process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "637253682693",
  appId: typeof process !== "undefined" && process.env.REACT_APP_FIREBASE_APP_ID || "1:637253682693:web:66523be6ed2edb7c67be6c",
  measurementId: typeof process !== "undefined" && process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-HSYS661N0X"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
```

---

## 4. Funções Operacionais do Frontend (React / ES Modules)

Funções prontas para integrar com as telas da sua aplicação:

### A. Fluxo de Autenticação (Login)
```javascript
import { loginUsuario, obterPerfilUsuario } from "./firebaseService";

// Exemplo de manipulação no submit do formulário React
const handleLogin = async (email, password) => {
  try {
    const userCredential = await loginUsuario(email, password);
    const user = userCredential.user;
    
    // Busca o papel (Role) do usuário cadastrado no Firestore
    const perfil = await obterPerfilUsuario(user.uid);
    
    if (perfil) {
      console.log(`Usuário logado como ${perfil.role}:`, perfil.nome);
      // Redirecione ou salve o estado da Role da forma ideal na sua app (ex: Context ou Redux)
      return { user, role: perfil.role };
    }
  } catch (err) {
    alert("Falha no login: Credenciais inválidas ou sem conexão.");
  }
};
```

### B. Criação de Chamado com Auditoria
A criação de um chamado realiza uma gravação atômica via transação, salvando o chamado e gerando o log no histórico de auditoria:
```javascript
import { criarChamado } from "./firebaseService";

const handleCriarChamado = async (event) => {
  event.preventDefault();
  
  const novosDados = {
    assunto: "Falha na impressora fiscal",
    descricao: "Não emite nota e exibe erro de papel preso.",
    categoria: "TI",
    prioridade: "Média"
  };

  try {
    // A função 'criarChamado' vincula automaticamente o cliente_id do usuário autenticado no SDK
    const ticketId = await criarChamado(novosDados);
    alert(`Chamado aberto com sucesso! ID: ${ticketId}`);
  } catch (error) {
    alert("Erro ao abrir chamado. Verifique suas permissões.");
  }
};
```

### C. Consulta Estruturada baseada em Roles (RBAC)
Exemplo de hook do React (`useEffect`) para carregar a listagem filtrada dinamicamente com base nas regras do banco de dados:
```javascript
import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { listarChamadosPorPerfil, obterPerfilUsuario } from "./firebaseService";

export function ListagemChamados() {
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // 1. Busca a role do usuário no Firestore
        const perfil = await obterPerfilUsuario(user.uid);
        
        // 2. Consulta os chamados autorizados para essa role específica
        const lista = await listarChamadosPorPerfil(perfil.role, user.uid);
        setChamados(lista);
      } catch (error) {
        console.error("Erro ao listar chamados:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  if (loading) return <p>Carregando chamados...</p>;

  return (
    <ul>
      {chamados.map(c => (
        <li key={c.id}>
          <strong>[{c.ticket_code}] {c.assunto}</strong> - Status: {c.status} (Prioridade: {c.prioridade})
        </li>
      ))}
    </ul>
  );
}
```

---

## 5. Variáveis de Ambiente na Vercel: Guia Rápido

Para implantar em produção na Vercel sem expor chaves sensíveis diretamente em commits, configure variáveis de ambiente no painel do projeto:

1. Acesse o console da **Vercel** e clique no seu projeto.
2. Vá na aba **Settings** e selecione **Environment Variables** no menu lateral esquerdo.
3. Adicione cada variável abaixo informando o respectivo valor:

| Key | Value | Exemplo / Dica |
|---|---|---|
| `REACT_APP_FIREBASE_API_KEY` | `AIzaSyCkIq3bjPck-UUT2tWZm8nEAHNQd_bWS7I` | Chave de API pública |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | `suportetecnico-825a7.firebaseapp.com` | Domínio de Auth |
| `REACT_APP_FIREBASE_PROJECT_ID` | `suportetecnico-825a7` | ID do Projeto Firebase |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | `suportetecnico-825a7.firebasestorage.app` | Storage Bucket |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | `637253682693` | ID do remetente de mensagens |
| `REACT_APP_FIREBASE_APP_ID` | `1:637253682693:web:66523be6ed2edb7c67be6c` | Identificador único do App |
| `REACT_APP_FIREBASE_MEASUREMENT_ID` | `G-HSYS661N0X` | ID do Analytics (opcional) |

4. Clique em **Save**.
5. Na próxima compilação (*Redeploy*), a Vercel injetará essas variáveis no processo de build e elas serão lidas pelo seu arquivo `firebaseConfig.js`.

> [!NOTE]
> Se o projeto for migrado para o Vite no futuro, altere o prefixo das chaves de `REACT_APP_` para `VITE_` e acesse utilizando `import.meta.env.VITE_...` no arquivo de inicialização.
