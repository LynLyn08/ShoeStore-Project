//backend/models/paymentcallbacklog.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PaymentCallbackLog extends Model {
    static associate(models) {
      PaymentCallbackLog.belongsTo(models.PaymentTransaction, { foreignKey: 'PaymentTxnID', as: 'transaction' });
    }
  }
  PaymentCallbackLog.init({
    LogID: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      field: 'LogID'
    },
    PaymentTxnID: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'PaymentTxnID',
      references: { model: 'PaymentTransactions', key: 'PaymentTxnID' }
    },
    Channel: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'Channel'
    },
    QueryString: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'QueryString'
    },
    ReceivedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'ReceivedAt'
    },
    RemoteIP: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'RemoteIP'
    }
  }, {
    sequelize,
    modelName: 'PaymentCallbackLog',
    tableName: 'PaymentCallbackLog',
    timestamps: false
  });
  return PaymentCallbackLog;
};