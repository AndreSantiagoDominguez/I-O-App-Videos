const GetAllVideosOutput = require("../dtos/getAllVideos.dtos");

class GetAllVideos {
  constructor(db) {
    this.db = db;
  }

  async execute() {
    const videos = await this.db.getAllVideos();
    return new GetAllVideosOutput(videos);
  }
}

module.exports = GetAllVideos
