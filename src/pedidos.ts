import { DatabaseSync } from "node:sqlite";

export function calcularTotal(quantidade: number): number {
  if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 1000) {
    throw new RangeError("Quantidade deve ser um inteiro de 1 a 1000.");
  }
  return quantidade * 1250;
}

type Pedido = {
  id: number;
  quantidade: number;
  totalCentavos: number;
};

export function abrirPedidos(caminho: string) {
  const banco = new DatabaseSync(caminho);
  banco.exec(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY,
      quantidade INTEGER NOT NULL CHECK (quantidade BETWEEN 1 AND 1000),
      total_centavos INTEGER NOT NULL CHECK (total_centavos = quantidade * 1250)
    ) STRICT
  `);

  const inserir = banco.prepare(
    "INSERT INTO pedidos (quantidade, total_centavos) VALUES (?, ?)",
  );
  const buscar = banco.prepare(
    "SELECT id, quantidade, total_centavos AS totalCentavos FROM pedidos WHERE id = ?",
  );
  const listar = banco.prepare(
    "SELECT id, quantidade, total_centavos AS totalCentavos FROM pedidos ORDER BY id",
  );

  return {
    criar(quantidade: number): Pedido {
      const totalCentavos = calcularTotal(quantidade);
      const { lastInsertRowid } = inserir.run(quantidade, totalCentavos);
      return { id: Number(lastInsertRowid), quantidade, totalCentavos };
    },
    buscar(id: number) {
      return buscar.get(id);
    },
    listar() {
      return listar.all();
    },
    fechar() {
      banco.close();
    },
  };
}
