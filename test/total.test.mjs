import assert from "node:assert/strict";
import test from "node:test";
import { calcularTotal } from "../dist/pedidos.js";

test("calcula o total de três itens em centavos", () => {
  assert.equal(calcularTotal(3), 3750);
});

test("rejeita quantidades fora do intervalo permitido", () => {
  for (const quantidade of [0, 1.5, 1001, NaN]) {
    assert.throws(() => calcularTotal(quantidade), RangeError);
  }
});

test("aceita os dois limites da quantidade", () => {
  assert.equal(calcularTotal(1), 1250);
  assert.equal(calcularTotal(1000), 1250000);
});
