FROM node:20-alpine AS build
WORKDIR /app
# Render injects NODE_ENV=production during build; tsc lives in devDependencies.
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm ci --include=dev
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
