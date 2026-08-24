# Multi-stage production image for monk.run
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV LEADERBOARD_PORT=47448
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server ./server
COPY scripts/serve-prod.mjs ./scripts/serve-prod.mjs
EXPOSE 47448
CMD ["node", "scripts/serve-prod.mjs"]
