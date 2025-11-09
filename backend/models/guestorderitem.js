// backend/models/guestorderitem.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class GuestOrderItem extends Model {
    static associate(models) {
      GuestOrderItem.belongsTo(models.GuestOrder, { foreignKey: 'GuestOrderID', as: 'guestOrder' });
      GuestOrderItem.belongsTo(models.ProductVariant, { foreignKey: 'VariantID', as: 'variant' });
    }
  }
  GuestOrderItem.init({
    GuestOrderItemID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'GuestOrderItemID'
    },
    GuestOrderID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'GuestOrderID',
      references: { model: 'GuestOrders', key: 'GuestOrderID' }
    },
    VariantID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'VariantID',
      references: { model: 'ProductVariants', key: 'VariantID' }
    },
    Quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
      field: 'Quantity'
    },
    Price: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      validate: { min: 0 },
      field: 'Price'
    }
  }, {
    sequelize,
    modelName: 'GuestOrderItem',
    tableName: 'GuestOrderItems',
    timestamps: false
  });
  return GuestOrderItem;
};