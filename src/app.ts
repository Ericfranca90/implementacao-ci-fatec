import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";

import { abrirPedidos, calcularTotal } from "./pedidos.js";

class ErroHttp extends Error {
  constructor(
    readonly status: number,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

async function lerQuantidade(requisicao: IncomingMessage): Promise<number> {
  const tipo = requisicao.headers["content-type"]
    ?.split(";")[0]
    .trim()
    .toLowerCase();
  if (tipo !== "application/json") {
    throw new ErroHttp(415, "Use Content-Type application/json.");
  }

  requisicao.setEncoding("utf8");
  let corpo = "";
  for await (const trecho of requisicao.iterator({ destroyOnReturn: false })) {
    corpo += trecho as string;
    if (Buffer.byteLength(corpo, "utf8") > 4096) {
      requisicao.resume();
      throw new ErroHttp(413, "Corpo da requisição acima de 4 KiB.");
    }
  }

  let dados: unknown;
  try {
    dados = JSON.parse(corpo);
  } catch {
    throw new ErroHttp(400, "JSON inválido.");
  }
  if (
    typeof dados !== "object" ||
    dados === null ||
    !("quantidade" in dados) ||
    typeof dados.quantidade !== "number"
  ) {
    throw new ErroHttp(400, "Informe uma quantidade numérica.");
  }

  return dados.quantidade;
}

function responder(resposta: ServerResponse, status: number, dados: unknown) {
  resposta.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });
  resposta.end(JSON.stringify(dados));
}

export function criarServidor(pedidos: ReturnType<typeof abrirPedidos>) {
  return createServer(async (requisicao, resposta) => {
    try {
      const url = new URL(requisicao.url ?? "/", "http://localhost");
      const { pathname } = url;
      const metodo = requisicao.method;

      if (metodo === "GET" && pathname === "/api/total") {
        const quantidade = Number(url.searchParams.get("quantidade"));
        return responder(resposta, 200, {
          totalCentavos: calcularTotal(quantidade),
        });
      }

      if (pathname === "/api/pedidos") {
        if (metodo === "GET") return responder(resposta, 200, pedidos.listar());
        if (metodo === "POST") {
          const pedido = pedidos.criar(await lerQuantidade(requisicao));
          resposta.setHeader("Location", `/api/pedidos/${pedido.id}`);
          return responder(resposta, 201, pedido);
        }
        resposta.setHeader("Allow", "GET, POST");
        return responder(resposta, 405, { erro: "Método não permitido." });
      }

      if (metodo === "GET" && pathname.startsWith("/api/pedidos/")) {
        const idTexto = pathname.slice("/api/pedidos/".length);
        const id = Number(idTexto);
        if (/^[1-9]\d*$/.test(idTexto) && Number.isSafeInteger(id)) {
          const pedido = pedidos.buscar(id);
          if (pedido) return responder(resposta, 200, pedido);
        }
      }

      return responder(resposta, 404, { erro: "Rota ou pedido inexistente." });
    } catch (erro) {
      if (erro instanceof ErroHttp)
        return responder(resposta, erro.status, { erro: erro.message });
      if (erro instanceof RangeError)
        return responder(resposta, 400, { erro: erro.message });
      console.error("Falha ao processar requisição", erro);
      return responder(resposta, 500, { erro: "Erro interno." });
    }
  });
}
