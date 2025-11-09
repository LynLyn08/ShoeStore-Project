'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class OrderSurvey extends Model {
    static associate(models) {
      OrderSurvey.belongsTo(models.Order, { foreignKey: 'OrderID', as: 'order' });
      OrderSurvey.belongsTo(models.User, { foreignKey: 'UserID', as: 'user' });
    }
  }
  const surveyStatusEnum = ['poor', 'ok', 'good'];
  OrderSurvey.init({
    SurveyID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: 'SurveyID' },
    OrderID: { type: DataTypes.INTEGER, allowNull: false, unique: true, field: 'OrderID', references: { model: 'Orders', key: 'OrderID' } },
    UserID: { type: DataTypes.INTEGER, allowNull: false, field: 'UserID', references: { model: 'Users', key: 'UserID' } },
    DeliveryTime: { type: DataTypes.ENUM(...surveyStatusEnum), allowNull: true, field: 'DeliveryTime' },
    Quality: { type: DataTypes.ENUM(...surveyStatusEnum), allowNull: true, field: 'Quality' },
    Shipping: { type: DataTypes.ENUM(...surveyStatusEnum), allowNull: true, field: 'Shipping' },
    Support: { type: DataTypes.ENUM('no', 'yes'), allowNull: true, field: 'Support' },
    CreatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'CreatedAt' }
  }, { sequelize, modelName: 'OrderSurvey', tableName: 'OrderSurveys', timestamps: false });
  return OrderSurvey;
};