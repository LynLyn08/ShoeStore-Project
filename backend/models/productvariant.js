// backend/models/productvariant.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProductVariant extends Model {
    static associate(models) {
      // Một biến thể thuộc về một sản phẩm
      ProductVariant.belongsTo(models.Product, { foreignKey: 'ProductID', as: 'product' });
      // Một biến thể có thể có nhiều hình ảnh
      ProductVariant.hasMany(models.ProductImage, { foreignKey: 'VariantID', as: 'images' });
      // Một biến thể có thể nằm trong nhiều cart items
      ProductVariant.hasMany(models.CartItem, { foreignKey: 'VariantID', as: 'cartItems' });
      // Một biến thể có thể nằm trong nhiều order items
      ProductVariant.hasMany(models.OrderItem, { foreignKey: 'VariantID', as: 'orderItems' });
       ProductVariant.hasMany(models.GuestOrderItem, { foreignKey: 'VariantID', as: 'guestOrderItems' });
    }
  }
  ProductVariant.init({
    VariantID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'VariantID'
    },
    ProductID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'ProductID',
      references: {
        model: 'Products',
        key: 'ProductID'
      }
    },
    Size: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'Size'
    },
    Color: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'Color'
    },
    StockQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      field: 'StockQuantity'
    },
    SKU: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: true,
      field: 'SKU'
    },
    IsActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'IsActive'
    }
  }, {
    sequelize,
    modelName: 'ProductVariant',
    tableName: 'ProductVariants',
    timestamps: false
  });
  return ProductVariant;
};