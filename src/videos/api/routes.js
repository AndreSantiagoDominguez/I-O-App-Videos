const path = require("path");
const { Worker, MessageChannel } = require("worker_threads");

const { getGetAllVideos, getGetVideoById, getAddVideo} = require("./deps");
const getAllVideosUseCase = getGetAllVideos();
const getVideoByIdUseCase = getGetVideoById();
const addVideoUseCase = getAddVideo();

const {
  GetAllVideosResponse,
  GetVideoByIdRequest,
  AddVideoRequest,
  ErrorResponse,
} = require("./schemas");

// Función auxiliar para parsear multipart/form-data
function parseMultipart(buffer, boundary) {
    const parts = [];
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    let start = 0;

    while (true) {
        const boundaryIndex = buffer.indexOf(boundaryBuffer, start);
        if (boundaryIndex === -1) break;

        const nextBoundaryIndex = buffer.indexOf(boundaryBuffer, boundaryIndex + boundaryBuffer.length);
        if (nextBoundaryIndex === -1) break;

        const partBuffer = buffer.slice(boundaryIndex + boundaryBuffer.length, nextBoundaryIndex);
        const headerEndIndex = partBuffer.indexOf('\r\n\r\n');
        
        if (headerEndIndex !== -1) {
            const headers = partBuffer.slice(0, headerEndIndex).toString();
            const data = partBuffer.slice(headerEndIndex + 4);

            const nameMatch = headers.match(/name="([^"]+)"/);
            const filenameMatch = headers.match(/filename="([^"]+)"/);

            if (nameMatch) {
                parts.push({
                    name: nameMatch[1],
                    filename: filenameMatch ? filenameMatch[1] : null,
                    data: data.slice(0, -2)
                });
            }
        }

        start = nextBoundaryIndex;
    }

    return parts;
}

// Creamos la función del router que maneja la petición
const videosRouter = async (req, res) => {
  const { method, url } = req;

  // Manejamos la ruta para obtener todos los videos
  if (method === "GET" && url === "/videos") {
    try {
      const videos = await getAllVideosUseCase.execute();
      res.writeHead(200, { "Content-Type": "application/json" });

      // Se instancia la clase que sirve como respuesta
      res.end(JSON.stringify(new GetAllVideosResponse(videos, true)));
    } catch (error) {
      console.error("Error en /videos:", error);
      res.writeHead(500, { "Content-Type": "application/json" });

      // Se instancia la clase que sirve como respuesta
      res.end(JSON.stringify(new ErrorResponse(error.message, false)));
    }
    return;
  }

  const videoIdMatch = url.match(/^\/videos\/(\d+)$/);
  if (method === "GET" && videoIdMatch) {
    try {
      const videoId = videoIdMatch[1];

      // 1. Intentamos crear el objeto de petición. Si el ID es inválido, esto lanzará un error.
      const request = new GetVideoByIdRequest(videoId);
      const videoData = await getVideoByIdUseCase.execute(request.id);

      if (!videoData || videoData.video == {}) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify(new ErrorResponse("Video no econtrado", false)));
        return;
      }

      const videoPath = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "data",
        videoData.video.url
      );

      //console.log(videoPath);

      // Creamos un MessageChannel para recibir los chunks binarios desde el worker
      const { port1, port2 } = new MessageChannel();

      // 1. Instanciamos el worker
      const worker = new Worker(
        path.resolve(
          __dirname,
          "..",
          "infrastructure",
          "services",
          "video.worker.js"
        )
      );

      // 2. Enviamos la ruta y le transferimos uno de los puertos
      // Indicamos format: "mp3" para que el worker use opciones adecuadas
      worker.postMessage({ videoPath, format: "mp3", port: port2 }, [port2]);

      // 3. Preparamos las cabeceras para el streaming de audio
      res.writeHead(200, {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${videoData.video.name}.mp3"`,
      });

      // 4. Escuchamos los mensajes que llegan por port1 (chunks, errores, fin)
      port1.on("message", (msg) => {
        if (msg.error) {
          console.error("Error desde el worker:", msg.error);
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
          }
          res.end(JSON.stringify(new ErrorResponse(msg.error, false)));
          port1.close();
          worker.terminate();
          return;
        }

        if (msg.chunk) {
          // msg.chunk llega como ArrayBuffer transferido
          res.write(Buffer.from(msg.chunk));
          return;
        }

        if (msg.end) {
          // ffmpeg terminó
          res.end();
          port1.close();
          worker.terminate();
        }
      });

      // Si el worker emite error no manejado
      worker.on("error", (err) => {
        console.error("Error fatal en el worker:", err);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
        }
        res.end(JSON.stringify(new ErrorResponse(err.message || err, false)));
        try {
          port1.close();
        } catch (e) { }
      });

      // Si el cliente corta la conexión, terminamos el worker
      res.on("close", () => {
        try {
          worker.terminate();
        } catch (e) { }
        try {
          port1.close();
        } catch (e) { }
      });
    } catch (error) {
      // 3. Si el constructor lanzó un error, lo atrapamos aquí.
      console.error("Error de validación:", error.message);
      res.writeHead(400, { "Content-Type": "application/json" }); // 400 Bad Request
      res.end(JSON.stringify(new ErrorResponse(error.message, false)));
    }
    return;
  }

  if (method === "POST" && url === "/videos") {
    try {
      let body = [];
      let boundary = null;

      // Obtener el boundary del Content-Type
      const contentType = req.headers["content-type"];
      if (contentType && contentType.includes("multipart/form-data")) {
        const boundaryMatch = contentType.match(/boundary=(.+)$/);
        if (boundaryMatch) {
          boundary = boundaryMatch[1];
        }
      }

      if (!boundary) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify(new ErrorResponse("Content-Type debe ser multipart/form-data", false)));
        return;
      }

      // Recibir los chunks del body
      req.on("data", (chunk) => {
        body.push(chunk);
      });

      req.on("end", async () => {
        try {
          const buffer = Buffer.concat(body);
          const parts = parseMultipart(buffer, boundary);

          const videoFile = parts.find(p => p.name === "video");
          const nameField = parts.find(p => p.name === "name");

          if (!videoFile || !nameField) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify(new ErrorResponse("Faltan campos requeridos: video y name", false)));
            return;
          }

          // Validar el request con la clase AddVideoRequest
          const request = new AddVideoRequest(videoFile.filename, nameField.data.toString());

          // Ejecutar el caso de uso
          const savedVideo = await addVideoUseCase.execute({
            buffer: videoFile.data,
            originalName: videoFile.filename,
            name: request.name
          });

          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            data: savedVideo,
            status: true
          }));

        } catch (error) {
          console.error("Error procesando el video:", error);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify(new ErrorResponse(error.message, false)));
        }
      });

      req.on("error", (error) => {
        console.error("Error en la petición:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify(new ErrorResponse(error.message, false)));
      });

    } catch (error) {
      console.error("Error en POST /videos:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify(new ErrorResponse(error.message, false)));
    }
    return;
  }

}



module.exports = { videosRouter };
