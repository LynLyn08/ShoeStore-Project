// backend/models/user.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Định nghĩa các mối quan hệ ở đây sau khi tạo các model khác
      User.hasMany(models.Address, { foreignKey: 'UserID', as: 'addresses' });
      User.hasMany(models.Order, { foreignKey: 'UserID', as: 'orders' });
      User.hasMany(models.Review, { foreignKey: 'UserID', as: 'reviews' });
      User.hasMany(models.Wishlist, { foreignKey: 'UserID', as: 'wishlist' });
      User.hasMany(models.PasswordResetToken, { foreignKey: 'UserID', as: 'passwordResetTokens' });
      User.hasMany(models.Cart, { foreignKey: 'UserID', as: 'carts' });
      User.hasMany(models.UsageLog, { foreignKey: 'UserID', as: 'usageLogs' });
      User.hasMany(models.OrderSurvey, { foreignKey: 'UserID', as: 'orderSurveys' });
      User.hasMany(models.UserVoucher, { foreignKey: 'UserID', as: 'vouchers' });
    }
  }
  User.init({
    UserID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'UserID'
    },
    Username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'Username'
    },
    Email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      },
      field: 'Email'
    },
    Password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'Password'
    },
    Role: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user',
      field: 'Role'
    },
    FullName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'FullName'
    },
    Phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'Phone'
    },
    Address: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'Address'
    },
    TwoFactorSecret: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'TwoFactorSecret'
    },
    TwoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'TwoFactorEnabled'
    },
    CreatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'CreatedAt'
    },
    AvatarURL: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'AvatarURL'
    },
    ResetToken: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'ResetToken'
    },
    ResetTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'ResetTokenExpiry'
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: false // Tắt timestamps tự động vì đã có CreatedAt
  });
  return User;
};