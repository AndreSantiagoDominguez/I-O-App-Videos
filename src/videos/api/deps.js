const IVideosRepositorySequelize = require("../infrastructure/persistence/IVideos.repository");
const GetAllVideos = require("../application/usecases/getAllVideos.usecase");

// Instanciar Repositorio
const db = new IVideosRepositorySequelize();

// Instanciar Casos de Uso
const getAllVideos = new GetAllVideos(db);

// Funcion que retorna la instancia del caso de uso
const getGetAllVideos = () => {
  return getAllVideos;
};

module.exports = { getGetAllVideos };
