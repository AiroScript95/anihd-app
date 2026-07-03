export async function iniciarBanco(db) {
  // Cria uma tabela simples
  await db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            pass TEXT UNIQUE NOT NULL
        )
    `);

  return db;
}
export async function criarUsuario(db, nome, pass) {
  const resultado = await db.run(
    "INSERT INTO usuarios (nome, pass) VALUES (?, ?)",
    [nome, pass],
  );
  console.log(`Usuário inserido com o ID: ${resultado.lastID}`);
}
// Buscar todos os usuários
export async function listarUsuarios(db) {
  const usuarios = await db.all("SELECT * FROM usuarios");
  console.log("Todos os usuários:", usuarios);
  return usuarios;
}

// Buscar um usuário específico por ID
export async function buscarUsuarioPorId(db, id) {
  const usuario = await db.get("SELECT * FROM usuarios WHERE id = ?", [id]);
  console.log("Usuário encontrado:", usuario);
}
// Atualizar
export async function atualizarPass(db, id, novoPass) {
  const resultado = await db.run("UPDATE usuarios SET pass = ? WHERE id = ?", [
    novoPass,
    id,
  ]);
  console.log(`Linhas atualizadas: ${resultado.changes}`);
}

// Deletar
export async function deletarUsuario(db, id) {
  const resultado = await db.run("DELETE FROM usuarios WHERE id = ?", [id]);
  console.log(`Linhas deletadas: ${resultado.changes}`);
}
