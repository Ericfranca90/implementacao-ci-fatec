import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { criarServidor } from "./app.js";
import { abrirPedidos } from "./pedidos.js";

const caminho = process.env.DB_PATH ?? "data/pedidos.sqlite";
mkdirSync(dirname(caminho), { recursive: true });
const pedidos = abrirPedidos(caminho);

const servidor = criarServidor(pedidos);
const porta = Number(process.env.PORT ?? 3000);
servidor.listen(porta, "0.0.0.0", () => {
  console.log(`API de pedidos disponível na porta ${porta} com SQLite.`);
});

for (const sinal of ["SIGINT", "SIGTERM"] as const) {
  process.once(sinal, () => servidor.close(() => pedidos.fechar()));
}
