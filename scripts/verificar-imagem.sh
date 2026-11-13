#!/usr/bin/env bash
set -euo pipefail

container=$(docker run -d --pull=never -p 127.0.0.1::3000 "$1")
trap 'docker logs "$container" || true; docker rm -f "$container" >/dev/null' EXIT
endereco=$(docker port "$container" 3000/tcp)
base="http://$endereco/api/pedidos"

curl -fsS --retry 5 --retry-all-errors --max-time 3 "$base" >/dev/null
criado=$(curl -fsS --max-time 3 -H 'Content-Type: application/json' \
  --data '{"quantidade":3}' "$base")
consultado=$(curl -fsS --max-time 3 "$base/1")

printf 'Pedido criado no SQLite do contêiner: %s\n' "$criado"
printf 'Pedido consultado pela API: %s\n' "$consultado"
test "$criado" = '{"id":1,"quantidade":3,"totalCentavos":3750}'
test "$consultado" = "$criado"
