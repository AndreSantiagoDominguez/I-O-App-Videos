const {
  GetVideoByIdInput,
  GetVideoByIdOutput,
} = require("../dtos/getVideoById.dtos");

class GetVideoById {
  constructor(db) {
    this.db = db;
  }

  async execute(id) {
    const input = new GetVideoByIdInput(id);
    const video = await this.db.getVideoById(input.id);
    return new GetVideoByIdOutput(video);
  }
}

module.exports = GetVideoById;
