const Video = require("../../domain/video");

const toVideoEntity = (videoModel) => {
  return new Video(
    parseInt(videoModel.id),
    videoModel.url,
    videoModel.name,
    new Date(videoModel.createdAt),
    new Date(videoModel.updatedAt)
  );
};

module.exports = { toVideoEntity };
