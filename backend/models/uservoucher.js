'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserVoucher extends Model {
    
    static associate(models) {
      // Một UserVoucher thuộc về 1 User
      UserVoucher.belongsTo(models.User, {
        foreignKey: 'UserID',
        as: 'user'
      });
      // Một UserVoucher thuộc về 1 Coupon
      UserVoucher.belongsTo(models.Coupon, {
        foreignKey: 'CouponID',
        as: 'coupon'
      });
    }
  }
  UserVoucher.init({
    UserID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'Users', // Tên model
        key: 'UserID'
      }
    },
    CouponID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'Coupons', // Tên model
        key: 'CouponID'
      }
    },
    IsUsed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'UserVoucher',
    tableName: 'UserVouchers',
    timestamps: true, // Tự động thêm createdAt
    updatedAt: false  // Không cần updatedAt
  });
  return UserVoucher;
};