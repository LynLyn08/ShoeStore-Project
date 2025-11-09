// backend/models/guestorder.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class GuestOrder extends Model {
    static associate(models) {
      // Đơn hàng của khách có thể được liên kết với một User sau này
      GuestOrder.belongsTo(models.User, { foreignKey: 'UserID', as: 'user' });
      // THÊM: Liên kết với nhà vận chuyển
      GuestOrder.belongsTo(models.ShippingProvider, { foreignKey: 'ShippingProviderID', as: 'shippingProvider' });
      // Một đơn hàng của khách có nhiều GuestOrderItems
      GuestOrder.hasMany(models.GuestOrderItem, { foreignKey: 'GuestOrderID', as: 'items' });
      GuestOrder.hasMany(models.UsageLog, { foreignKey: 'GuestOrderID', as: 'usageLogs' });
      GuestOrder.hasMany(models.PaymentTransaction, { foreignKey: 'GuestOrderID', as: 'paymentTransactions' });
    }
  }
  GuestOrder.init({
    GuestOrderID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'GuestOrderID'
    },
    Email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { isEmail: true },
      field: 'Email'
    },
    FullName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'FullName'
    },
    Phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'Phone'
    },
    Address: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'Address'
    },
    Subtotal: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true
    },
    ShippingFee: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      field: 'ShippingFee' // Đảm bảo field này tồn tại
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
    // THÊM: Trường khóa ngoại cho ShippingProvider
    ShippingProviderID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'ShippingProviderID',
      references: {
        model: 'ShippingProviders',
        key: 'ProviderID'
      }
    },
    // Vẫn giữ trường cũ để tương thích ngược nếu cần, nhưng nên ưu tiên dùng ID
    ShippingProvider: {
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
    },
    UserID: {
      type: DataTypes.INTEGER,
      allowNull: true, // Cho phép NULL
      field: 'UserID',
      references: { model: 'Users', key: 'UserID' }
    }
  }, {
    sequelize,
    modelName: 'GuestOrder',
    tableName: 'GuestOrders',
    timestamps: false
  });
  return GuestOrder;
};