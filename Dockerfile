# Usa una imagen oficial de Node.js como base. La v18-alpine es ligera y estable.
FROM alpine:3.18

ENV NODE_VERSION 22.20.0

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos package.json y package-lock.json al directorio de trabajo
# Se copian primero por separado para aprovechar el caché de Docker.
COPY package*.json ./

# Instala las dependencias del proyecto (incluyendo las de desarrollo para la build si es necesario)
RUN npm install

# Copia el resto de los archivos de tu proyecto al directorio de trabajo
COPY . .

# Expone el puerto en el que correrá tu API dentro del contenedor
EXPOSE 3000

# Define el comando para ejecutar la aplicación cuando se inicie el contenedor
CMD [ "node", "src/server.js" ]