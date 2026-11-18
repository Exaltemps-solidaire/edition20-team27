# Service api : Node exécute le TypeScript directement, sans compilation. Seule dépendance : pg.
FROM docker.io/library/node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src
ENV NODE_ENV=production PORT=8081
EXPOSE 8081
USER node
CMD ["node", "src/server.ts"]
