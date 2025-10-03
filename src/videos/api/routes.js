const path = require("path");
const { Worker, MessageChannel } = require("worker_threads");

const { getGetAllVideos, getGetVideoById } = require("./deps");
const getAllVideosUseCase = getGetAllVideos();
const getVideoByIdUseCase = getGetVideoById();

const {
  GetAllVideosResponse,
  GetVideoByIdRequest,
  ErrorResponse,
} = require("./schemas");

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
        } catch (e) {}
      });

      // Si el cliente corta la conexión, terminamos el worker
      res.on("close", () => {
        try {
          worker.terminate();
        } catch (e) {}
        try {
          port1.close();
        } catch (e) {}
      });
    } catch (error) {
      // 3. Si el constructor lanzó un error, lo atrapamos aquí.
      console.error("Error de validación:", error.message);
      res.writeHead(400, { "Content-Type": "application/json" }); // 400 Bad Request
      res.end(JSON.stringify(new ErrorResponse(error.message, false)));
    }
    return;
  }
};

module.exports = { videosRouter };
