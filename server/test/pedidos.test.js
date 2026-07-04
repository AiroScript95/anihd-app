import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import {
  adicionarPedido,
  lerPedidos,
  normalizarNomePedido,
} from "../lib/pedidos.js";

const tmpRoot = join(process.cwd(), ".tmp-test-pedidos");

test.afterEach(async () => {
  await rm(tmpRoot, { recursive: true, force: true });
});

async function criarDatabase(conteudo = []) {
  await mkdir(tmpRoot, { recursive: true });
  const filePath = join(tmpRoot, "database.json");
  await writeFile(filePath, JSON.stringify(conteudo, null, 2));
  return filePath;
}

test("normaliza nomes ignorando caixa, acentos e espaços extras", () => {
  assert.equal(normalizarNomePedido("  Pokémon   Journeys "), "pokemon journeys");
});

test("adiciona pedido válido com campos normalizados e status padrão", async () => {
  const filePath = await criarDatabase();

  const resultado = await adicionarPedido(filePath, {
    nome: "  Naruto  ",
    desc: "  Episódios em HD  ",
  });

  assert.equal(resultado.ok, true);
  assert.deepEqual(await lerPedidos(filePath), [
    {
      Anime: "Naruto",
      Descricao: "Episódios em HD",
      Status: "analisando...",
    },
  ]);
});

test("rejeita pedido sem nome", async () => {
  const filePath = await criarDatabase();

  const resultado = await adicionarPedido(filePath, {
    nome: "   ",
    desc: "Sem nome",
  });

  assert.equal(resultado.ok, false);
  assert.equal(resultado.codigo, "nome_obrigatorio");
  assert.deepEqual(await lerPedidos(filePath), []);
});

test("usa descrição padrão quando o motivo fica vazio", async () => {
  const filePath = await criarDatabase();

  await adicionarPedido(filePath, {
    nome: "Bleach",
    desc: "   ",
  });

  assert.equal((await lerPedidos(filePath))[0].Descricao, "Sem descrição");
});

test("bloqueia duplicado com nome equivalente", async () => {
  const filePath = await criarDatabase([
    {
      Anime: "Pokémon Journeys",
      Descricao: "Pedido antigo",
      Status: "analisando...",
    },
  ]);

  const resultado = await adicionarPedido(filePath, {
    nome: "pokemon journeys",
    desc: "Novo pedido",
  });

  assert.equal(resultado.ok, false);
  assert.equal(resultado.codigo, "pedido_duplicado");
  assert.equal((await lerPedidos(filePath)).length, 1);
});

test("permite reenviar quando o pedido anterior foi rejeitado", async () => {
  const filePath = await criarDatabase([
    {
      Anime: "One Piece",
      Descricao: "Pedido antigo",
      Status: "rejeitado",
    },
  ]);

  const resultado = await adicionarPedido(filePath, {
    nome: "one piece",
    desc: "Reavaliar",
  });

  const pedidos = await lerPedidos(filePath);
  assert.equal(resultado.ok, true);
  assert.equal(pedidos.length, 2);
  assert.equal(pedidos[1].Anime, "one piece");
});

test("retorna lista vazia quando a base não existe ou está inválida", async () => {
  assert.deepEqual(await lerPedidos(join(tmpRoot, "nao-existe.json")), []);

  const filePath = await criarDatabase();
  await writeFile(filePath, "{ json inválido");

  assert.deepEqual(await lerPedidos(filePath), []);
});
