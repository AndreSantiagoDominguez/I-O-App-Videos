# Usa la imagen oficial de Node.js (LTS) como base
FROM node:18-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia package.json y package-lock.json para aprovechar caché de dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm ci --only=production

# Copia el resto de los archivos de la aplicación
COPY . .

# Expone el puerto en el que correrá la API
EXPOSE 3000

# Ejecuta la aplicación
CMD [ "node", "src/server.js" ]