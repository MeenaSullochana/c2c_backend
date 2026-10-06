FROM node:20-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npx tsc
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/server.js"]
