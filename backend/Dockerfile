# ---- deps ----
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---- runtime ----
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p uploads/reports logs && chown -R app:app /app
USER app
EXPOSE 5000
CMD ["node", "src/server.js"]