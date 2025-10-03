const IVideosRepositorySequelize = require("../infrastructure/persistence/IVideos.repository");
const GetAllVideos = require("../application/usecases/getAllVideos.usecase");
const GetVideoById = require("../application/usecases/getVideoById.usecase");
const AddVideo = require("../application/usecases/addVideo.usecase");

// Instanciar Repositorio
const db = new IVideosRepositorySequelize();

// Instanciar Casos de Uso
const getAllVideos = new GetAllVideos(db);
const getVideoById = new GetVideoById(db);
const addVideo = new AddVideo(db);

// Funcion que retorna la instancia del caso de uso
const getGetAllVideos = () => {
  return getAllVideos;
};

const getGetVideoById = () => {
  return getVideoById;
};

const getAddVideo = () => {
  return addVideo;
};

module.exports = { getGetAllVideos, getGetVideoById, getAddVideo };
