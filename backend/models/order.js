// backend/models/order.js (đầy đủ, thêm ShippingProviderID vào init)

'use strict';

const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      // Một đơn hàng thuộc về một User
      Order.belongsTo(models.User, { foreignKey: 'UserID', as: 'user' });
      // Một đơn hàng được giao tới một Address
      Order.belongsTo(models.Address, { foreignKey: 'ShippingAddressID', as: 'shippingAddress' });
      // THÊM: Thuộc về một ShippingProvider
      Order.belongsTo(models.ShippingProvider, { foreignKey: 'ShippingProviderID', as: 'shippingProvider' });
      // Một đơn hàng có nhiều OrderItems
      Order.hasMany(models.OrderItem, { foreignKey: 'OrderID', as: 'items' });
      Order.hasMany(models.UsageLog, { foreignKey: 'OrderID', as: 'usageLogs' });
      Order.hasMany(models.PaymentTransaction, { foreignKey: 'OrderID', as: 'paymentTransactions' });
      Order.hasOne(models.OrderSurvey, { foreignKey: 'OrderID', as: 'survey' });
    }
  }

  Order.init({
    OrderID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'OrderID'
    },
    UserID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'UserID',
      references: {
        model: 'Users',
        key: 'UserID'
      }
    },
    ShippingAddressID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'ShippingAddressID',
      references: {
        model: 'Addresses',
        key: 'AddressID'
      }
    },
    // THÊM: FK cho ShippingProvider (optional, allowNull true)
    ShippingProviderID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'ShippingProviderID',
      references: {
        model: 'ShippingProviders',
        key: 'ProviderID'
      }
    },
    Subtotal: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true
    },
    ShippingFee: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      field: 'ShippingFee' 
    },
    DiscountAmount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true
    },
    TotalAmount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      validate: { min: 0 },
      field: 'TotalAmount'
    },
    ShippingFee: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      field: 'ShippingFee'
    },
    CouponCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'CouponCode'
    },
    Status: {
      type: DataTypes.ENUM('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'),
      allowNull: false,
      defaultValue: 'Pending',
      field: 'Status'
    },
    TrackingCode: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'TrackingCode'
    },
    ShippingProvider: {  // Giữ STRING cho backward compat, nhưng ưu tiên FK
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'ShippingProvider'
    },
    OrderDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'OrderDate'
    },
    PaymentMethod: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'COD',
      field: 'PaymentMethod'
    },
    PaymentStatus: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'Pending',
      field: 'PaymentStatus'
    },
    PaymentTxnRef: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'PaymentTxnRef'
    },
    PaidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'PaidAt'
    }
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'Orders',
    timestamps: false
  });

  return Order;
};