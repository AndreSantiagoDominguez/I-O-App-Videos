const addVideoInput = require("../dtos/addVideo.dto");
const fs = require("fs");
const { promisify } = require("util");
const writeFile = promisify(fs.writeFile);
const path = require("path");

class AddVideo {
  constructor(db) {
    this.db = db;
  }

  async execute(videoData) {
    console.log("[AddVideo] Iniciando proceso...");
    console.time("[AddVideo] Total");

    const { buffer, originalName, name } = videoData;

    if (!buffer || !originalName || !name) {
      throw new Error("Datos del video incompletos");
    }

    console.log(
      `[AddVideo] Tamaño del buffer: ${(buffer.length / 1024 / 1024).toFixed(
        2
      )} MB`
    );
    console.log(`[AddVideo] Nombre original: ${originalName}`);
    console.log(`[AddVideo] Nombre del video: ${name}`);

    // Generar nombre único para el archivo
    const fileExtension = path.extname(originalName);
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `${timestamp}_${randomString}${fileExtension}`;

    // Ruta absoluta donde se guardará el video
    const videoPath = path.join(process.cwd(), "data", fileName);

    console.log(`[AddVideo] Ruta destino: ${videoPath}`);
    console.time("[AddVideo] Guardar archivo");
    // Escribir el archivo directamente (usando la versión asíncrona)
    try {
      await writeFile(videoPath, Buffer.from(buffer));
      console.log("[AddVideo] Archivo guardado en disco");
    } catch (err) {
      console.error("[AddVideo] Error guardando archivo:", err.message || err);
      throw err;
    }

    const video = new addVideoInput(fileName, name);
    return await this.db.addVideo(video);
  }
}

module.exports = AddVideo;
