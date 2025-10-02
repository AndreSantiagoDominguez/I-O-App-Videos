class GetVideoByIdInput {
  constructor(id) {
    this.id = parseInt(id);
  }
}

class GetVideoByIdOutput {
  constructor(video) {
    this.video = video;
  }
}

module.exports = { GetVideoByIdInput, GetVideoByIdOutput };
