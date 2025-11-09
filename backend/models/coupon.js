// backend/models/coupon.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Coupon extends Model {
    static associate(models) {
      Coupon.hasMany(models.UsageLog, { foreignKey: 'CouponID', as: 'usageLogs' });
      Coupon.hasMany(models.UserVoucher, { foreignKey: 'CouponID', as: 'assignments' });
    }
  }
  Coupon.init({
    CouponID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'CouponID'
    },
    Code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'Code'
    },
   DiscountType: {
      type: DataTypes.ENUM('Percent', 'FixedAmount'),
      allowNull: false,
      defaultValue: 'Percent'
    },
    DiscountValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 },
      comment: 'Lưu % (VD: 20) hoặc số tiền (VD: 50000)'
    },
    MinPurchaseAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
      comment: 'Giá trị đơn hàng tối thiểu để áp dụng'
    },
    ExpiryDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'ExpiryDate'
    },
    MaxUses: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'MaxUses',
      comment: 'Tổng số lần sử dụng tối đa (toàn hệ thống)'
    },
    UsedCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'UsedCount'
    },

    // --- TRƯỜNG MỚI ---
    IsPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'True = Public (ai cũng nhập được), False = Private (phải có trong UserVoucher)'
    },
    UsesPerUser: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Giới hạn số lần dùng cho mỗi user (áp dụng cho public code)'
    },
    // --- HẾT TRƯỜNG MỚI ---

    CreatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'CreatedAt'
    }
  }, {
    sequelize,
    modelName: 'Coupon',
    tableName: 'Coupons',
    timestamps: false
  });
  return Coupon;
};