//backend/models/wishlist.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Wishlist extends Model {
    static associate(models) {
      Wishlist.belongsTo(models.User, { foreignKey: 'UserID', as: 'user' });
      Wishlist.belongsTo(models.Product, { foreignKey: 'ProductID', as: 'product' });
    }
  }
  Wishlist.init({
    WishlistID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'WishlistID'
    },
    UserID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'UserID',
      references: { model: 'Users', key: 'UserID' }
    },
    ProductID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'ProductID',
      references: { model: 'Products', key: 'ProductID' }
    },
    CreatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'CreatedAt'
    }
  }, {
    sequelize,
    modelName: 'Wishlist',
    tableName: 'Wishlist',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['UserID', 'ProductID']
        }
    ]
  });
  return Wishlist;
};