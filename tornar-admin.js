/**
 * Script para promover um usuário para ADMIN no Firestore
 * Uso: node tornar-admin.js <EMAIL_DO_USUARIO>
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCkIq3bjPck-UUT2tWZm8nEAHNQd_bWS7I",
  authDomain: "suportetecnico-825a7.firebaseapp.com",
  projectId: "suportetecnico-825a7",
  storageBucket: "suportetecnico-825a7.firebasestorage.app",
  messagingSenderId: "637253682693",
  appId: "1:637253682693:web:66523be6ed2edb7c67be6c"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

const emailAlvo = process.argv[2];

if (!emailAlvo) {
  console.error('\n❌  Uso correto: node tornar-admin.js <EMAIL>\n');
  console.error('    Exemplo: node tornar-admin.js wellington@empresa.com\n');
  process.exit(1);
}

async function promoverAdmin() {
  console.log(`\n🔍  Procurando usuário com e-mail: ${emailAlvo} ...`);

  try {
    const usuariosRef = collection(db, 'usuarios');
    const q           = query(usuariosRef, where('email', '==', emailAlvo));
    const snapshot    = await getDocs(q);

    if (snapshot.empty) {
      console.error(`\n❌  Nenhum usuário encontrado com o e-mail: ${emailAlvo}`);
      console.error('    Certifique-se de que você já fez login no portal ao menos uma vez.\n');
      process.exit(1);
    }

    const userDoc  = snapshot.docs[0];
    const userData = userDoc.data();

    console.log(`\n✅  Usuário encontrado:`);
    console.log(`    Nome  : ${userData.nome}`);
    console.log(`    E-mail: ${userData.email}`);
    console.log(`    Role atual: ${userData.role}`);

    if (userData.role === 'ADMIN') {
      console.log(`\n⚠️  Este usuário já é ADMIN. Nada a fazer.\n`);
      process.exit(0);
    }

    // Atualizar para ADMIN
    await updateDoc(doc(db, 'usuarios', userDoc.id), { role: 'ADMIN' });

    console.log(`\n🎉  Sucesso! ${userData.nome} agora é ADMINISTRADOR.`);
    console.log(`    Faça logout e login novamente no portal para aplicar.\n`);
    process.exit(0);

  } catch (error) {
    console.error('\n❌  Erro ao acessar o Firestore:', error.message, '\n');
    process.exit(1);
  }
}

promoverAdmin();
