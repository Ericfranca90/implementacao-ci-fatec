FROM node:24.22.1-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV DB_PATH=/app/data/pedidos.sqlite
RUN mkdir -p /app/data && chown node:node /app/data
COPY package.json ./
COPY dist/ ./dist/
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
