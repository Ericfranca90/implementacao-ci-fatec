import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { criarServidor } from "../dist/app.js";
import { abrirPedidos } from "../dist/pedidos.js";

async function iniciar(banco) {
  const pedidos = abrirPedidos(banco);
  const servidor = criarServidor(pedidos).listen(0, "127.0.0.1");
  await once(servidor, "listening");
  const base = `http://127.0.0.1:${servidor.address().port}`;
  return {
    base,
    async fechar() {
      await servidor[Symbol.asyncDispose]();
      pedidos.fechar();
    },
  };
}

function criarPedido(base, quantidade) {
  return globalThis.fetch(`${base}/api/pedidos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantidade }),
  });
}

test("POST cria um pedido no SQLite e GET lista e consulta o registro", async (t) => {
  const app = await iniciar(":memory:");
  t.after(() => app.fechar());
  const criada = await criarPedido(app.base, 3);
  assert.equal(criada.status, 201);
  assert.equal(criada.headers.get("location"), "/api/pedidos/1");
  const pedido = { id: 1, quantidade: 3, totalCentavos: 3750 };
  assert.deepEqual(await criada.json(), pedido);

  const consulta = await globalThis.fetch(`${app.base}/api/pedidos/1`);
  assert.equal(consulta.status, 200);
  assert.deepEqual(await consulta.json(), pedido);

  const lista = await globalThis.fetch(`${app.base}/api/pedidos`);
  assert.equal(lista.status, 200);
  assert.deepEqual(await lista.json(), [pedido]);
});

test("o pedido permanece após reabrir o arquivo SQLite", async (t) => {
  const pasta = await mkdtemp(join(tmpdir(), "api-pedidos-"));
  t.after(() => rm(pasta, { recursive: true, force: true }));
  const banco = join(pasta, "pedidos.sqlite");

  const primeiro = await iniciar(banco);
  try {
    const criada = await criarPedido(primeiro.base, 2);
    assert.equal(criada.status, 201);
    assert.equal((await criada.json()).totalCentavos, 2500);
  } finally {
    await primeiro.fechar();
  }

  const segundo = await iniciar(banco);
  try {
    const consulta = await globalThis.fetch(`${segundo.base}/api/pedidos/1`);
    assert.equal(consulta.status, 200);
    assert.deepEqual(await consulta.json(), {
      id: 1,
      quantidade: 2,
      totalCentavos: 2500,
    });
  } finally {
    await segundo.fechar();
  }
});

test("rejeita quantidade inválida sem gravar e retorna 404 para pedido ausente", async (t) => {
  const app = await iniciar(":memory:");
  t.after(() => app.fechar());
  const invalida = await criarPedido(app.base, 0);
  assert.equal(invalida.status, 400);
  assert.equal(
    (await invalida.json()).erro,
    "Quantidade deve ser um inteiro de 1 a 1000.",
  );

  const lista = await globalThis.fetch(`${app.base}/api/pedidos`);
  assert.deepEqual(await lista.json(), []);
  const ausente = await globalThis.fetch(`${app.base}/api/pedidos/99`);
  assert.equal(ausente.status, 404);
  await ausente.json();
});

test("mantém a rota de cálculo do roteiro individual", async (t) => {
  const app = await iniciar(":memory:");
  t.after(() => app.fechar());
  const resposta = await globalThis.fetch(`${app.base}/api/total?quantidade=3`);
  assert.equal(resposta.status, 200);
  assert.deepEqual(await resposta.json(), { totalCentavos: 3750 });
});
