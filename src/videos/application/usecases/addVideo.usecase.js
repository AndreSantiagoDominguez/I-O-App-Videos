const addVideoInput = require("../dtos/addVideo.dto");
const { Worker, MessageChannel } = require("worker_threads");
const path = require("path");

class AddVideo {
    constructor(db) {
        this.db = db;
    }

    async execute(videoData) {
        console.log('[AddVideo] Iniciando proceso...');
        console.time('[AddVideo] Total');

        const { buffer, originalName, name } = videoData;
        
        if (!buffer || !originalName || !name) {
            throw new Error("Datos del video incompletos");
        }

        console.log(`[AddVideo] Tamaño del buffer: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
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
        console.time('[AddVideo] Worker - Guardar archivo');

        // Delegar el guardado del archivo al worker para no bloquear el hilo principal
        await new Promise((resolve, reject) => {
            console.log('[AddVideo] Creando Worker...');
            const worker = new Worker(
                path.resolve(__dirname, "..", "..", "infrastructure", "services", "saveVideo.worker.js")
            );

            worker.postMessage({ buffer, videoPath });
            console.log('[AddVideo] Mensaje enviado al Worker');

            worker.on("message", (msg) => {
                if (msg.error) {
                    console.error('[AddVideo] Error en Worker:', msg.error);
                    reject(new Error(msg.error));
                    worker.terminate();
                    return;
                }

                if (msg.success) {
                    resolve();
                    worker.terminate();
                }
            });

            worker.on("error", (err) => {
                reject(err);
                worker.terminate();
            });
        });

        const video = new addVideoInput(fileName, name);
        return await this.db.addVideo(video);
    }
}

module.exports = AddVideo;