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
};
