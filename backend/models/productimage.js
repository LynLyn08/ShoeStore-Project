// backend/models/productimage.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProductImage extends Model {
    static associate(models) {
      ProductImage.belongsTo(models.Product, { foreignKey: 'ProductID', as: 'product' });
      ProductImage.belongsTo(models.ProductVariant, { foreignKey: 'VariantID', as: 'variant' });
    }
  }
  ProductImage.init({
    ImageID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'ImageID'
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
    VariantID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'VariantID',
      references: {
        model: 'ProductVariants',
        key: 'VariantID'
      }
    },
    ImageURL: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'ImageURL'
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
    }
  }, {
    sequelize,
    modelName: 'ProductImage',
    tableName: 'ProductImages',
    timestamps: false
  });
  return ProductImage;
};