// backend/models/orderitem.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class OrderItem extends Model {
    static associate(models) {
      OrderItem.belongsTo(models.Order, { foreignKey: 'OrderID', as: 'order' });
      OrderItem.belongsTo(models.ProductVariant, { foreignKey: 'VariantID', as: 'variant' });
    }
  }
  OrderItem.init({
    OrderItemID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'OrderItemID'
    },
    OrderID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'OrderID',
      references: { model: 'Orders', key: 'OrderID' }
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
    modelName: 'OrderItem',
    tableName: 'OrderItems',
    timestamps: false
  });
  return OrderItem;
};