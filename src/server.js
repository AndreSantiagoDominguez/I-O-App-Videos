const http = require("http");
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

const server = http.createServer(mainRouter);

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
