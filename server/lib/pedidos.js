import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";

const STATUS_PADRAO = "analisando...";
const DESCRICAO_PADRAO = "Sem descrição";
const TAMANHO_MAX_NOME = 120;
const TAMANHO_MAX_DESCRICAO = 1000;

export function normalizarTexto(valor) {
  return String(valor ?? "").trim().replace(/\s+/g, " ");
}

export function normalizarNomePedido(nome) {
  return normalizarTexto(nome)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizarStatus(status) {
  return normalizarTexto(status).toLowerCase();
}

export async function lerPedidos(databasePath) {
  try {
    const conteudo = await readFile(databasePath, "utf-8");
    const data = JSON.parse(conteudo);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function validarPedido({ nome, desc }, pedidos = []) {
  const anime = normalizarTexto(nome);
  const descricao = normalizarTexto(desc) || DESCRICAO_PADRAO;

  if (!anime) {
    return { ok: false, codigo: "nome_obrigatorio" };
  }

  if (anime.length > TAMANHO_MAX_NOME) {
    return { ok: false, codigo: "nome_muito_longo" };
  }

  if (descricao.length > TAMANHO_MAX_DESCRICAO) {
    return { ok: false, codigo: "descricao_muito_longa" };
  }

  const nomeNormalizado = normalizarNomePedido(anime);
  const duplicado = pedidos.some((pedido) => {
    const status = normalizarStatus(pedido.Status);
    return (
      normalizarNomePedido(pedido.Anime) === nomeNormalizado &&
      status !== "rejeitado"
    );
  });

  if (duplicado) {
    return { ok: false, codigo: "pedido_duplicado" };
  }

  return {
    ok: true,
    pedido: {
      Anime: anime,
      Descricao: descricao,
      Status: STATUS_PADRAO,
    },
  };
}

export async function adicionarPedido(databasePath, dados) {
  const pedidos = await lerPedidos(databasePath);
  const resultado = validarPedido(dados, pedidos);

  if (!resultado.ok) return resultado;

  const proximaLista = [...pedidos, resultado.pedido];
  await mkdir(dirname(databasePath), { recursive: true });
  await writeFile(databasePath, JSON.stringify(proximaLista, null, 2));

  return { ok: true, pedido: resultado.pedido };
}
