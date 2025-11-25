# Étape 1 : builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copier package.json et package-lock.json pour installer les dépendances
COPY package*.json ./

RUN npm install

# Copier tout le code source
COPY . .

# Compiler TypeScript
RUN npm run build

# Étape 2 : production
FROM node:20-alpine

WORKDIR /app

# Copier seulement les fichiers nécessaires depuis le builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env ./

# Port exposé
EXPOSE 3000

# Commande de démarrage
CMD ["node", "dist/server.js"]
