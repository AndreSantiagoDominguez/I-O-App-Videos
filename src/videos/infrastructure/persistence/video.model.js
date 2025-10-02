const { sequelize } = require("../../../core/db/connection");
const { DataTypes } = require("sequelize");

const VideoModel = sequelize.define(
  "Video",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    timestamps: true,
    underscored: true,
  }
);

module.exports = VideoModel;
