const IVideos = require("../../domain/IVideos");
const VideoModel = require("./video.model");
const { toVideoEntity } = require("./mapers");

class IVideosRepositorySequelize extends IVideos {
  constructor() {
    super();
  }

  async getAllVideos() {
    const videos = await VideoModel.findAll();
    return videos.map((v) => toVideoEntity(v));
  }

  async getVideoById(id) {
    return this.videos.find((v) => v.id === id) || null;
  }

  async addVideo(video) {
    this.videos.push(video);
    return video;
  }

  async deleteVideo(id) {
    const index = this.videos.findIndex((v) => v.id === id);
    if (index !== -1) {
      return this.videos.splice(index, 1)[0];
    }
    return null;
  }

  async updateVideo(id, videoData) {
    const index = this.videos.findIndex((v) => v.id === id);
    if (index !== -1) {
      this.videos[index] = { ...this.videos[index], ...videoData };
      return this.videos[index];
    }
    return null;
  }
}

module.exports = IVideosRepositorySequelize;
