# 1. Usamos la misma versión estable de Node.js 22
FROM node:22-alpine

# 2. Definimos su propia carpeta de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiamos los package.json del frontend
COPY package*.json ./

# 4. Instalamos las dependencias de Next.js y React usando npm install con opciones más robustas
RUN npm install --no-audit --prefer-offline

# 5. Copiamos todo el código de Next.js
COPY . .

# 6. Exponemos el puerto 3000 que usa Next.js por defecto
EXPOSE 3000

# 7. Arrancamos el servidor de desarrollo de Next.js
CMD ["npm", "run", "dev"]