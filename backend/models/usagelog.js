// backend/models/usagelog.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UsageLog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      UsageLog.belongsTo(models.Coupon, { foreignKey: 'CouponID', as: 'coupon' });
      UsageLog.belongsTo(models.User, { foreignKey: 'UserID', as: 'user' });
      UsageLog.belongsTo(models.Order, { foreignKey: 'OrderID', as: 'order' });
      UsageLog.belongsTo(models.GuestOrder, { foreignKey: 'GuestOrderID', as: 'guestOrder' });
    }
  }
  UsageLog.init({
    UsageID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'UsageID'
    },
    CouponID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'CouponID',
      references: { model: 'Coupons', key: 'CouponID' }
    },
    UserID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'UserID',
      references: { model: 'Users', key: 'UserID' }
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
    UsedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'UsedAt'
    }
  }, {
    sequelize,
    modelName: 'UsageLog',
    tableName: 'UsageLog',
    timestamps: false
  });
  return UsageLog;
};