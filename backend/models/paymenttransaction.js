//backend/models/paymenttransaction.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PaymentTransaction extends Model {
    static associate(models) {
      PaymentTransaction.belongsTo(models.PaymentMethod, { foreignKey: 'MethodID', as: 'method' });
      PaymentTransaction.belongsTo(models.Order, { foreignKey: 'OrderID', as: 'order' });
      PaymentTransaction.belongsTo(models.GuestOrder, { foreignKey: 'GuestOrderID', as: 'guestOrder' });
      PaymentTransaction.hasMany(models.PaymentCallbackLog, { foreignKey: 'PaymentTxnID', as: 'callbackLogs' });
    }
  }
  PaymentTransaction.init({
    PaymentTxnID: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      field: 'PaymentTxnID'
    },
    MethodID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'MethodID',
      references: { model: 'PaymentMethods', key: 'MethodID' }
    },
    OrderID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'OrderID',
      references: { model: 'Orders', key: 'OrderID' }
    },
    GuestOrderID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'GuestOrderID',
      references: { model: 'GuestOrders', key: 'GuestOrderID' }
    },
    Amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'Amount'
    },
    Currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'VND',
      field: 'Currency'
    },
    Status: {
      type: DataTypes.ENUM('Pending', 'Authorized', 'Paid', 'Failed', 'Canceled', 'Refunded'),
      allowNull: false,
      defaultValue: 'Pending',
      field: 'Status'
    },
    MerchantRef: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      field: 'MerchantRef'
    },
    GatewayTxnNo: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'GatewayTxnNo'
    },
    BankCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'BankCode'
    },
    CardType: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'CardType'
    },
    PayTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'PayTime'
    },
    ClientIP: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'ClientIP'
    },
    GatewayCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'GatewayCode'
    },
    Message: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'Message'
    },
    RawReturn: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'RawReturn'
    },
    RawIPN: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'RawIPN'
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
    },
    PaidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'PaidAt'
    }
  }, {
    sequelize,
    modelName: 'PaymentTransaction',
    tableName: 'PaymentTransactions',
    timestamps: false
  });
  return PaymentTransaction;
};