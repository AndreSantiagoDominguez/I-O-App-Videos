// Aquí se crean las clases con las que el servidor va a pedir datos o responder

class GetAllVideosResponse {
  constructor(videos, status) {
    this.data = videos;
    this.status = status;
  }
}

class GetVideoByIdRequest {
  constructor(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new Error("El ID del video debe ser un número entero positivo.");
    }
    this.id = numericId;
  }
}

class AddVideoRequest {
  constructor(filename, name) {
    if (!filename || !name) {
      throw new Error("El archivo y el nombre son requeridos.");
    }
    
    // Validar extensión del video
    const validExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv'];
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
    if (!validExtensions.includes(ext)) {
      throw new Error("Formato de video no válido. Extensiones permitidas: " + validExtensions.join(', '));
    }
    
    this.filename = filename;
    this.name = name;
  }
}

class ErrorResponse {
  constructor(error, status) {
    this.error = error;
    this.status = status;
  }
}

module.exports = {
  GetAllVideosResponse,
  ErrorResponse,
  GetVideoByIdRequest,
  AddVideoRequest
};
