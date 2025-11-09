//backend/models/paymentmethod.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PaymentMethod extends Model {
    static associate(models) {
      PaymentMethod.hasMany(models.PaymentTransaction, { foreignKey: 'MethodID', as: 'transactions' });
    }
  }
  PaymentMethod.init({
    MethodID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'MethodID'
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
    Type: {
      type: DataTypes.ENUM('OFFLINE', 'ONLINE'),
      allowNull: false,
      field: 'Type'
    },
    Provider: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'Provider'
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
    modelName: 'PaymentMethod',
    tableName: 'PaymentMethods',
    timestamps: false
  });
  return PaymentMethod;
};