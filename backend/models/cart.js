// backend/models/cart.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Cart extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Một giỏ hàng có thể thuộc về một User (nếu đã đăng nhập)
      Cart.belongsTo(models.User, { foreignKey: 'UserID', as: 'user' });
      // Một giỏ hàng có nhiều CartItems
      Cart.hasMany(models.CartItem, { foreignKey: 'CartID', as: 'items' });
    }
  }
  Cart.init({
    CartID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'CartID'
    },
    UserID: {
      type: DataTypes.INTEGER,
      allowNull: true, // Cho phép NULL đối với khách vãng lai
      field: 'UserID',
      references: {
        model: 'Users',
        key: 'UserID'
      }
    },
    SessionID: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'SessionID'
    },
    TotalItems: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'TotalItems'
    },
    CreatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'CreatedAt'
    },
    UpdatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'UpdatedAt'
    }
  }, {
    sequelize,
    modelName: 'Cart',
    tableName: 'Carts',
    timestamps: false
  });
  return Cart;
};