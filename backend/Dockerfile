# Stage 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json ./
# Copiamos package-lock.json también para instalaciones más rápidas y consistentes
COPY package-lock.json* ./
RUN npm install

# Stage 2: Build and run the application
FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# --- ¡ESTA ES LA LÍNEA NUEVA Y CLAVE! ---
# Creamos el directorio para las subidas de archivos dentro de la imagen.
# Esto asegura que la carpeta exista antes de que el volumen se monte.
RUN mkdir -p public/uploads

# Comando para ejecutar la app
CMD ["npm", "start"]
