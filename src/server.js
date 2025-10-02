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

// Servidor
const http = require("http");
const cluster = require("cluster");
const os = require("os");

const PORT = 3000;
const numCPUs = os.cpus().length;

// Cluster Principal
if (cluster.isPrimary) {
  console.log(`Procesos primario corriendo: ${process.pid}`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Evento que se ejecuta si un workwer falla
  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died... reloading`);
    cluster.fork();
  });
} else {
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  const server = http.createServer(mainRouter);

  server.listen(PORT, () => {
    console.log(
      `Worker ${process.pid} iniciado. Escuchando en http://localhost:${PORT}`
    );
  });
}
