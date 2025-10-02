const path = require("path");
const { Worker } = require("worker_threads");

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

      console.log(videoPath);

      // 1. Creamos una nueva instancia del worker
      const worker = new Worker(
        path.resolve(
          __dirname,
          "..",
          "infrastructure",
          "services",
          "video.worker.js"
        )
      );

      // 2. Le enviamos la ruta del video que debe procesar
      worker.postMessage({ videoPath });

      // 3. Preparamos las cabeceras para el streaming de video
      res.writeHead(200, { "Content-Type": "video/webm" });

      // 4. Conectamos la salida del worker DIRECTAMENTE a la respuesta HTTP. ¡Pura magia de streams!
      worker.stdout.pipe(res);

      // Manejo de errores desde el worker
      worker.on("message", (msg) => {
        if (msg.error) {
          console.error("Error desde el worker:", msg.error);
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
          }
          res.end(JSON.stringify(new ErrorResponse(msg.error, false)));
        }
      });

      worker.on("error", (err) => {
        console.error("Error fatal en el worker:", err);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
        }
        res.end(JSON.stringify(new ErrorResponse(err, false)));
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
