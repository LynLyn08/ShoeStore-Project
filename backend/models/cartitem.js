// backend/models/cartitem.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CartItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Một CartItem thuộc về một Cart
      CartItem.belongsTo(models.Cart, { foreignKey: 'CartID', as: 'cart' });
      // Một CartItem tương ứng với một ProductVariant
      CartItem.belongsTo(models.ProductVariant, { foreignKey: 'VariantID', as: 'variant' });
    }
  }
  CartItem.init({
    CartItemID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'CartItemID'
    },
    CartID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'CartID',
      references: {
        model: 'Carts',
        key: 'CartID'
      }
    },
    VariantID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'VariantID',
      references: {
        model: 'ProductVariants',
        key: 'VariantID'
      }
    },
    Quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1 // Số lượng phải lớn hơn 0
      },
      field: 'Quantity'
    },
    Price: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      validate: {
        min: 0
      },
      field: 'Price'
    },
    AddedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'AddedAt'
    }
  }, {
    sequelize,
    modelName: 'CartItem',
    tableName: 'CartItems',
    timestamps: false
  });
  return CartItem;
};