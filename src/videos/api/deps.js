const IVideosRepositorySequelize = require("../infrastructure/persistence/IVideos.repository");
const GetAllVideos = require("../application/usecases/getAllVideos.usecase");
const GetVideoById = require("../application/usecases/getVideoById.usecase");

// Instanciar Repositorio
const db = new IVideosRepositorySequelize();

// Instanciar Casos de Uso
const getAllVideos = new GetAllVideos(db);
const getVideoById = new GetVideoById(db);

// Funcion que retorna la instancia del caso de uso
const getGetAllVideos = () => {
  return getAllVideos;
};

const getGetVideoById = () => {
  return getVideoById;
};

module.exports = { getGetAllVideos, getGetVideoById };
