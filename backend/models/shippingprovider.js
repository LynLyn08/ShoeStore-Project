//backend/models/shippingprovider.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ShippingProvider extends Model {
    static associate(models) {
      // Một nhà vận chuyển có thể có nhiều đơn hàng
      ShippingProvider.hasMany(models.Order, { foreignKey: 'ShippingProviderID', as: 'orders' });
      ShippingProvider.hasMany(models.GuestOrder, { foreignKey: 'ShippingProviderID', as: 'guestOrders' });
    }
  }
  ShippingProvider.init({
    ProviderID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'ProviderID'
    },
    Code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: 'Code'
    },
    Name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'Name'
    },
    Fee: {
      type: DataTypes.DECIMAL(10, 2),  
      allowNull: false,
      defaultValue: 0.00,
      field: 'Fee'
    },
    IsActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'IsActive'
    },
    ConfigJson: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'ConfigJson'
    },
    CreatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'CreatedAt'
    },
    UpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'UpdatedAt'
    }
  }, {
    sequelize,
    modelName: 'ShippingProvider',
    tableName: 'ShippingProviders',
    timestamps: false
  });
  return ShippingProvider;
};