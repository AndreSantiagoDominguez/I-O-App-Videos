/* const { parentPort } = require('worker_threads');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

parentPort.on('message', ({ videoPath }) => {
  if (!fs.existsSync(videoPath)) {
    parentPort.postMessage({ error: 'El archivo de video no existe.' });
    return;
  }

  // Configura FFmpeg
  const command = ffmpeg(videoPath)
    .withVideoBitrate('500k') // Baja la calidad del video (ej. 500kbps)
    .withAudioBitrate('128k') // Baja la calidad del audio
    .toFormat('mp4')
    .on('error', (err) => {
      console.error('Error en FFMPEG:', err);
      // En caso de error en ffmpeg, lo comunicamos al hilo principal
      parentPort.postMessage({ error: err.message });
    });
    
  // Hacemos pipe de la salida de FFmpeg directamente al 'stdout' del worker.
  // El hilo principal podrá leer este stream.
  command.pipe(process.stdout);
}); */

// src/workers/video.worker.js

// src/workers/video.worker.js

// src/workers/video.worker.js

// src/workers/video.worker.js

const { parentPort } = require('worker_threads');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

parentPort.on('message', ({ videoPath }) => {
  if (!fs.existsSync(videoPath)) { /* ... */ }

  const command = ffmpeg(videoPath)
    .withVideoCodec('libvpx-vp9')
    .withAudioCodec('libopus')
    .toFormat('webm')
    .withVideoBitrate('500k')

    // --- ¡NUEVAS OPCIONES DE VELOCIDAD! ---
    .outputOptions([
      '-preset ultrafast', // Sacrifica calidad por muchísima más velocidad
      '-threads 2'         // Puedes ajustar el número de hilos que usa ffmpeg
    ])
    .size('120x?') // Redimensiona a 640px de ancho, manteniendo la proporción
    // ------------------------------------

    .on('start', (commandLine) => {
      console.log('✅ Comando FFmpeg iniciado: ' + commandLine);
    })
    .on('stderr', (stderrLine) => {
      console.log('🔎 Salida de FFmpeg: ' + stderrLine);
    })
    .on('error', (err) => { /* ... */ });

  command.pipe(process.stdout);
});