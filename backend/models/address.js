// backend/models/address.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Address extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Một địa chỉ thuộc về một User
      Address.belongsTo(models.User, { foreignKey: 'UserID', as: 'user' });
      Address.hasMany(models.Order, { foreignKey: 'ShippingAddressID', as: 'orders' });
    }
  }
  Address.init({
    AddressID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'AddressID'
    },
    UserID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'UserID',
      references: {
        model: 'Users', // Tên bảng tham chiếu
        key: 'UserID'
      }
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
    Street: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'Street'
    },
    City: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'City'
    },
    State: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'State'
    },
    Country: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Việt Nam',
      field: 'Country'
    },
    Email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      },
      field: 'Email'
    },
    Note: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'Note'
    },
    IsDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'IsDefault'
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
    modelName: 'Address',
    tableName: 'Addresses',
    timestamps: false // Tắt timestamps tự động vì đã định nghĩa thủ công
  });
  return Address;
};