const { getGetAllVideos } = require("./deps");
const getAllVideosUseCase = getGetAllVideos();
const { GetAllVideosResponse, ErrorResponse } = require("./schemas");

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

  // Aquí podrías agregar más rutas de videos, como GET /api/videos/:id, POST /api/videos, etc.
};

module.exports = { videosRouter };
