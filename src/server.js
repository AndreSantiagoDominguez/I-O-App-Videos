// Gestión del router
const { videosRouter } = require("./videos/api/routes");

const mainRouter = (req, res) => {
  const { url } = req;

  // Si la URL empieza con '/videos', delegamos la petición al router de videos
  if (url.startsWith("/videos")) {
    return videosRouter(req, res);
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Ruta no encontrada" }));
};

// Servidor (single-process)
const http = require("http");
const PORT = 4000;

const server = http.createServer(mainRouter);

server.listen(PORT, () => {
  console.log(
    `Process ${process.pid} iniciado. Escuchando en http://localhost:${PORT}`
  );
});
