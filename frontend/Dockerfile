# Multi-stage Next.js Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL=https://guardian-angel-703744831646.us-central1.run.app
ARG BACKEND_URL=https://guardian-angel-703744831646.us-central1.run.app
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV BACKEND_URL=$BACKEND_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV BACKEND_URL=https://guardian-angel-703744831646.us-central1.run.app
ENV NEXT_PUBLIC_API_URL=https://guardian-angel-703744831646.us-central1.run.app
COPY --from=builder /app/next.config.js next.config.js
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]

