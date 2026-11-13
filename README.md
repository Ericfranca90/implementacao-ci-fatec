# API de pedidos | Implementação do CI

Atividade de Integração e Entrega Contínua da Fatec Jacareí. A aplicação estende a API de pedidos do roteiro individual com persistência em SQLite. Cada item custa R$ 12,50, e o cálculo usa valores em centavos.

## Executar a API

Requer Git e Node.js 24.22.1 com npm.

```bash
npm ci
npm run build
npm start
```

O banco é criado na primeira execução em `data/pedidos.sqlite`. A variável `DB_PATH` permite configurar outro caminho.

| Método e rota | Resultado |
| --- | --- |
| `GET /api/total?quantidade=3` | Simula o total de 3 itens. Resposta `200` |
| `POST /api/pedidos` | Grava o pedido. Envie JSON como `{"quantidade":3}`. Resposta `201` |
| `GET /api/pedidos` | Lista os pedidos. Resposta `200` |
| `GET /api/pedidos/1` | Consulta o pedido 1. Resposta `200` ou `404` |

Exemplo no terminal Bash ou Git Bash:

```bash
curl -i -H 'Content-Type: application/json' --data '{"quantidade":3}' http://localhost:3000/api/pedidos
curl -i http://localhost:3000/api/pedidos/1
```

## Workflow

O arquivo `.github/workflows/ci.yml` executa em PRs para `main` quando são abertos, atualizados com commits ou reabertos. As etapas seguem esta ordem:

1. **Análise estática:** `npm run lint` verifica o código.
2. **Formatação:** `npm run format:check` confere o padrão com o Prettier.
3. **Segurança:** `npm run security:check` aplica regras estáticas específicas para SQL dinâmico e execução de código ou comandos.
4. **Build:** `npm run build` compila TypeScript para `dist/`.
5. **Testes unitários:** `npm run test:unit` testa a função de cálculo isoladamente.
6. **Testes de integração:** `npm run test:integration` verifica as respostas HTTP e a persistência com SQLite.
7. **Imagem Docker:** o runner empacota o conteúdo de `dist/`, inicia um contêiner e comprova a gravação e a consulta de um pedido. A imagem é identificada pelo SHA e exportada como artefato.

As verificações estáticas vêm antes da compilação. Os testes usam os arquivos compilados e precedem o empacotamento. Se um passo falhar, os seguintes são pulados.

### Reproduzir localmente

```bash
npm ci
npm run lint
npm run format:check
npm run security:check
npm run build
npm run test:unit
npm run test:integration
docker build -t api-pedidos:local .
bash scripts/verificar-imagem.sh api-pedidos:local
```

As duas últimas linhas requerem Docker e Bash. Para rodar a CI, envie os arquivos em uma branch e abra um PR para `main`. A aba **Checks** do PR mostra as etapas. A aba **Actions** mostra o resumo da execução e o artefato da imagem.
