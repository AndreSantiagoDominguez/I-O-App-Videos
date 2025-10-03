# I-O-App-Videos

## Instalación

1. Instala Docker en tu sistema operativo
2. Instala las dependencias del proyecto:

   ```bash
   npm install
   ```

3. Crea el un directorio en la raíz del proyecto llamado `data`

   ```bash
   mkdir data
   ```

4. Crea las variables de entorno (.env) en la raíz del proyecto:

   ```text
   POSTGRES_DB=dbvideos
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_HOST=127.0.0.1
   POSTGRES_PORT=5433
   PATH=./data/
   ```

5. Navega hasta el directorio en donde se encuentra `docker-compose.yml`:

   ```bash
   cd src/core/docker/
   ```

6. Antes asegúrate que tengas ejecutando docker, y corre el comando:

   ```bash
   docker-compose up -d
   ```

   Esto iniciará la ejecución del contenedor donde está PostgreSQL y luego estará la API

   Para detener la ejecución del contenedor:

   ```bash
   docker-compose down
   ```

7. Ejecución de la API:
   Ubicate en la raíz del proyecto y corre el comando:

   ```bash
   node src/server.js
   ```
