const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });

const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
  {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    dialect: "postgres",
    logging: false,

    // Configuración del Pool de Conexiones
    pool: {
      max: 10, // Número máximo de conexiones activas
      min: 0, // Número mínimo de conexiones
      acquire: 30000, // Tiempo máximo (ms) que Sequelize intentará obtener una conexión antes de lanzar un error
      idle: 10000, // Tiempo máximo (ms) que una conexión puede estar inactiva antes de ser liberada
    },
  }
);

const testDbConnection = async () => {
  try {
    // El método .authenticate() intenta conectarse y lanza un error si falla.
    await sequelize.authenticate();
    console.log("Conexión a la base de datos establecida correctamente.");
  } catch (error) {
    console.error("No se pudo conectar a la base de datos:", error);
  }
};

module.exports = { sequelize, testDbConnection };
