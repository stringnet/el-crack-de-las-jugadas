# ---- STAGE 1: DEPENDENCIAS ----
# Usamos una imagen base ligera de Node.js
FROM node:18-alpine AS deps

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos solo el package.json para aprovechar el cache de Docker.
# Si package.json no cambia, Docker no volverá a instalar las dependencias.
COPY package.json ./
RUN npm install

# ---- STAGE 2: CONSTRUCCIÓN (BUILD) ----
# Usamos la misma imagen base
FROM node:18-alpine AS builder
WORKDIR /app

# Copiamos las dependencias ya instaladas del stage anterior
COPY --from=deps /app/node_modules ./node_modules
# Copiamos el resto del código fuente
COPY . .

# Ejecutamos el comando de build de Next.js para generar la versión de producción
RUN npm run build

# ---- STAGE 3: PRODUCCIÓN ----
# Usamos la misma imagen base ligera
FROM node:18-alpine AS runner
WORKDIR /app

# Establecemos el entorno a producción para optimizaciones de Next.js
ENV NODE_ENV production

# Copiamos los archivos de la construcción (build) del stage anterior
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Exponemos el puerto 3000 (el puerto por defecto de Next.js)
EXPOSE 3000

# El comando que se ejecutará cuando el contenedor inicie
CMD ["npm", "start"]
