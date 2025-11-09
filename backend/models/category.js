// backend/models/category.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Một danh mục có nhiều sản phẩm
      Category.hasMany(models.Product, { foreignKey: 'CategoryID', as: 'products' });
    }
  }
  Category.init({
    CategoryID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'CategoryID'
    },
    Name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'Name'
    },
    TargetGroup: {
      type: DataTypes.ENUM('Men', 'Women', 'Kids', 'Unisex'),
      allowNull: false,
      field: 'TargetGroup'
    },
    Description: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'Description'
    },
    IsActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'IsActive'
    },
    CreatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'CreatedAt'
    }
  }, {
    sequelize,
    modelName: 'Category',
    tableName: 'Categories',
    timestamps: false
  });
  return Category;
};