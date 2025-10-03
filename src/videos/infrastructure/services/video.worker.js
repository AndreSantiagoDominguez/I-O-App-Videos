// Worker que ejecuta ffmpeg como proceso hijo y stream de audio al hilo principal
const { parentPort } = require("worker_threads");
const { spawn } = require("child_process");
const fs = require("fs");

// El worker espera recibir: { videoPath, format, port }
parentPort.on("message", (message) => {
  const { videoPath, format, port } = message || {};

  if (!videoPath) {
    parentPort.postMessage({ error: "videoPath no fue proporcionado" });
    return;
  }

  if (!fs.existsSync(videoPath)) {
    parentPort.postMessage({ error: `El archivo no existe: ${videoPath}` });
    return;
  }

  if (!port) {
    parentPort.postMessage({
      error: "No se recibió el MessagePort para streaming",
    });
    return;
  }

  // Opciones enfocadas en velocidad: sacrificar calidad
  // Para mp3: -vn (no video), -ac 2 (stereo), -b:a 64k (baja calidad), -ar 22050 (sample rate bajo)
  const ffmpegArgs = ["-hide_banner", "-loglevel", "warning", "-i", videoPath];

  if (format === "mp3") {
    ffmpegArgs.push(
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
      "pipe:1"
    );
  } else {
    ffmpegArgs.push(
      "-vn",
      "-ac",
      "2",
      "-ar",
      "22050",
      "-b:a",
      "64k",
      "-f",
      "mp3",
      "pipe:1"
    );
  }

  // Spawn ffmpeg directamente
  const ff = spawn("ffmpeg", ffmpegArgs, { windowsHide: true });

  ff.on("error", (err) => {
    try {
      port.postMessage({
        error: `falló al ejecutar ffmpeg: ${err.message || err}`,
      });
    } catch (e) {
      parentPort.postMessage({
        error: `falló al enviar error: ${e.message || e}`,
      });
    }
  });

  // Cuando ffmpeg escribe en stdout, leemos chunks y los transferimos como ArrayBuffer
  ff.stdout.on("data", (chunk) => {
    try {
      // Preferimos transferir el ArrayBuffer subyacente cuando sea posible
      if (chunk && chunk.buffer) {
        const ab = chunk.buffer.slice(
          chunk.byteOffset,
          chunk.byteOffset + chunk.byteLength
        );
        port.postMessage({ chunk: ab }, [ab]);
      } else {
        // Fallback: enviar copia
        port.postMessage({ chunk: Buffer.from(chunk) });
      }
    } catch (e) {
      // En caso de fallo al transferir, intentar enviar copia
      try {
        port.postMessage({ chunk: Buffer.from(chunk) });
      } catch (err) {
        parentPort.postMessage({
          error: `error enviando chunk: ${err.message || err}`,
        });
      }
    }
  });

  ff.stderr.on("data", (d) => {
    const text = d.toString();
    // Si ffmpeg lanza un error crítico, lo comunicamos
    if (/Error|invalid|failed/i.test(text)) {
      try {
        port.postMessage({ error: text });
      } catch (e) {
        parentPort.postMessage({
          error: `error enviando stderr: ${e.message || e}`,
        });
      }
    }
  });

  ff.on("close", (code, signal) => {
    if (code && code !== 0) {
      try {
        port.postMessage({ error: `ffmpeg exited with code ${code}` });
      } catch (e) {
        parentPort.postMessage({
          error: `error enviando cierre: ${e.message || e}`,
        });
      }
    }

    try {
      port.postMessage({ end: true });
    } catch (e) {
      parentPort.postMessage({
        error: `error enviando end: ${e.message || e}`,
      });
    }

    try {
      port.close();
    } catch (e) {}
  });
});
