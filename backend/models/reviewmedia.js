//backend/models/reviewmedia.js
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ReviewMedia extends Model {
    static associate(models) {
      ReviewMedia.belongsTo(models.Review, { foreignKey: 'ReviewID', as: 'review' });
    }
  }
  ReviewMedia.init({
    MediaID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: 'MediaID' },
    ReviewID: { type: DataTypes.INTEGER, allowNull: false, field: 'ReviewID', references: { model: 'Reviews', key: 'ReviewID' } },
    MediaURL: { type: DataTypes.STRING(500), allowNull: false, field: 'MediaURL' },
    IsVideo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'IsVideo' },
    CreatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'CreatedAt' }
  }, { sequelize, modelName: 'ReviewMedia', tableName: 'ReviewMedia', timestamps: false });
  return ReviewMedia;
};