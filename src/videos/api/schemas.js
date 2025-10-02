// Aquí se crean las clases con las que el servidor va a pedir datos o responder

class GetAllVideosResponse {
  constructor(videos, status) {
    this.data = videos;
    this.status = status;
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
};
