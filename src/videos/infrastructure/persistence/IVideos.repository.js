const IVideos = require("../../domain/IVideos");
const VideoModel = require("./video.model");
const { toVideoEntity } = require("./mapers");

class IVideosRepositorySequelize extends IVideos {
  constructor() {
    super();
  }

  async getAllVideos() {
    const videos = await VideoModel.findAll({ raw: true });
    return videos.map(toVideoEntity);
  }

  async getVideoById(id) {
    const video = await VideoModel.findByPk(id, { raw: true });
    return video ? toVideoEntity(video) : {};
  }

  async addVideo(video) {
    this.videos.push(video);
    return video;
  }

  async deleteVideo(id) {
    const numberOfRowsDestroyed = await VideoModel.destroy({
      where: { id: id },
    });
    return numberOfRowsDestroyed > 0;
  }
}

module.exports = IVideosRepositorySequelize;
