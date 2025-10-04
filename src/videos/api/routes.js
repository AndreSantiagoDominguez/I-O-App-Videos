const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const { getGetAllVideos, getGetVideoById, getAddVideo } = require("./deps");
const getAllVideosUseCase = getGetAllVideos();
const getVideoByIdUseCase = getGetVideoById();
const addVideoUseCase = getAddVideo();

const {
  GetAllVideosResponse,
  GetVideoByIdRequest,
  AddVideoRequest,
  ErrorResponse,
} = require("./schemas");

function parseMultipart(buffer, boundary) {
  const parts = [];
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  let start = 0;
  while (true) {
    const boundaryIndex = buffer.indexOf(boundaryBuffer, start);
    if (boundaryIndex === -1) break;
    const nextBoundaryIndex = buffer.indexOf(
      boundaryBuffer,
      boundaryIndex + boundaryBuffer.length
    );
    if (nextBoundaryIndex === -1) break;
    const partBuffer = buffer.slice(
      boundaryIndex + boundaryBuffer.length,
      nextBoundaryIndex
    );
    const headerEndIndex = partBuffer.indexOf("\r\n\r\n");
    if (headerEndIndex !== -1) {
      const headers = partBuffer.slice(0, headerEndIndex).toString();
      const data = partBuffer.slice(headerEndIndex + 4);
      const nameMatch = headers.match(/name="([^"]+)"/);
      const filenameMatch = headers.match(/filename="([^"]+)"/);
      if (nameMatch)
        parts.push({
          name: nameMatch[1],
          filename: filenameMatch ? filenameMatch[1] : null,
          data: data.slice(0, -2),
        });
    }
    start = nextBoundaryIndex;
  }
  return parts;
}

const videosRouter = async (req, res) => {
  const { method, url } = req;

  if (method === "GET" && url === "/videos") {
    try {
      const videos = await getAllVideosUseCase.execute();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(new GetAllVideosResponse(videos, true)));
    } catch (err) {
      console.error("Error en /videos:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify(new ErrorResponse(err.message, false)));
    }
    return;
  }

  const videoIdMatch = url.match(/^\/videos\/(\d+)$/);
  if (method === "GET" && videoIdMatch) {
    try {
      const videoId = videoIdMatch[1];
      const request = new GetVideoByIdRequest(videoId);
      const videoData = await getVideoByIdUseCase.execute(request.id);
      if (!videoData || !videoData.video) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify(new ErrorResponse("Video no encontrado", false))
        );
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
      if (!fs.existsSync(videoPath)) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify(new ErrorResponse("Video no encontrado", false))
        );
        return;
      }
      const ffmpegArgs = [
        "-hide_banner",
        "-loglevel",
        "warning",
        "-i",
        videoPath,
        "-vn",
        "-ac",
        "2",
        "-ar",
        "22050",
        "-b:a",
        "64k",
        "-threads",
        "2",
        "-f",
        "mp3",
        "pipe:1",
      ];
      const ff = spawn("ffmpeg", ffmpegArgs, { windowsHide: true });
      res.writeHead(200, { "Content-Type": "audio/mpeg" });
      ff.stdout.on("data", (chunk) => {
        try {
          res.write(chunk);
        } catch (e) {
          console.error("Error escribiendo chunk al response:", e);
        }
      });
      ff.stderr.on("data", (d) => {
        const text = d.toString();
        if (/Error|invalid|failed/i.test(text)) {
          console.error("ffmpeg stderr:", text);
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify(new ErrorResponse(text, false)));
          } else {
            try {
              res.end();
            } catch (e) {}
          }
          try {
            ff.kill();
          } catch (e) {}
        }
      });
      ff.on("close", () => {
        try {
          res.end();
        } catch (e) {}
      });
      ff.on("error", (err) => {
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify(new ErrorResponse(err.message || err, false)));
        } else {
          try {
            res.end();
          } catch (e) {}
        }
      });
      res.on("close", () => {
        try {
          ff.kill();
        } catch (e) {}
      });
    } catch (error) {
      console.error("Error de validación:", error.message);
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify(new ErrorResponse(error.message, false)));
    }
    return;
  }

  if (method === "POST" && url === "/videos") {
    try {
      let body = [];
      let boundary = null;
      const contentType =
        req.headers["content-type"] || req.headers["Content-Type"];
      if (contentType && contentType.includes("multipart/form-data")) {
        const boundaryMatch = contentType.match(/boundary=(.+)$/);
        if (boundaryMatch) boundary = boundaryMatch[1];
      }
      if (!boundary) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify(
            new ErrorResponse(
              "Content-Type debe ser multipart/form-data",
              false
            )
          )
        );
        return;
      }
      req.on("data", (chunk) => {
        body.push(chunk);
      });
      req.on("end", async () => {
        try {
          const buffer = Buffer.concat(body);
          const parts = parseMultipart(buffer, boundary);
          const videoFile = parts.find((p) => p.name === "video");
          const nameField = parts.find((p) => p.name === "name");
          if (!videoFile || !nameField) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify(
                new ErrorResponse(
                  "Faltan campos requeridos: video y name",
                  false
                )
              )
            );
            return;
          }
          const request = new AddVideoRequest(
            videoFile.filename,
            nameField.data.toString()
          );
          const savedVideo = await addVideoUseCase.execute({
            buffer: videoFile.data,
            originalName: videoFile.filename,
            name: request.name,
          });
          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ data: savedVideo, status: true }));
        } catch (err) {
          console.error("Error procesando el video:", err);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify(new ErrorResponse(err.message, false)));
        }
      });
      req.on("error", (error) => {
        console.error("Error en la petición:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify(new ErrorResponse(error.message, false)));
      });
    } catch (err) {
      console.error("Error en POST /videos:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify(new ErrorResponse(err.message, false)));
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify(new ErrorResponse("Ruta no encontrada", false)));
};

module.exports = { videosRouter };
