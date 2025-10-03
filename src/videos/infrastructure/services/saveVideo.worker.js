const { parentPort } = require("worker_threads");
const fs = require("fs");
const path = require("path");

parentPort.on("message", async (message) => {
    const { buffer, videoPath } = message;

    if (!buffer || !videoPath) {
        parentPort.postMessage({ error: "Buffer o ruta del video no proporcionados" });
        return;
    }

    try {
        // Asegurar que el directorio 'data' existe
        const dataDir = path.dirname(videoPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Escribir el archivo en disco de forma síncrona en el worker
        fs.writeFileSync(videoPath, Buffer.from(buffer));

        parentPort.postMessage({ success: true });
    } catch (error) {
        parentPort.postMessage({ error: error.message });
    }
});