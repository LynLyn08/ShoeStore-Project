// backend/models/product.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      // Một sản phẩm thuộc về một danh mục
      Product.belongsTo(models.Category, { foreignKey: 'CategoryID', as: 'category' });
      // Một sản phẩm có nhiều biến thể
      Product.hasMany(models.ProductVariant, { foreignKey: 'ProductID', as: 'variants' });
      // Một sản phẩm có nhiều hình ảnh
      Product.hasMany(models.ProductImage, { foreignKey: 'ProductID', as: 'images' });
      // Một sản phẩm có thể có trong nhiều danh sách yêu thích
      Product.hasMany(models.Wishlist, { foreignKey: 'ProductID', as: 'wishlistedBy' });
       // Một sản phẩm có nhiều đánh giá
      Product.hasMany(models.Review, { foreignKey: 'ProductID', as: 'reviews' });
    }
  }
  Product.init({
    ProductID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'ProductID'
    },
    Name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'Name'
    },
    Description: {
      type: DataTypes.TEXT, // NVARCHAR(MAX) -> TEXT
      allowNull: true,
      field: 'Description'
    },
    Price: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      validate: {
        min: 0
      },
      field: 'Price'
    },
    DiscountPercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      },
      field: 'DiscountPercent'
    },
    // Cột tính toán (computed column) trong DB.
    // Dùng VIRTUAL để model có thể truy cập nhưng không cố ghi vào DB.
    // Logic tính toán thực sự vẫn nằm ở DB.
    DiscountedPrice: {
      type: DataTypes.VIRTUAL,
      get() {
        const price = parseFloat(this.Price);
        const discount = parseFloat(this.DiscountPercent);
        if (discount > 0) {
          return price * (1 - discount / 100);
        }
        return price;
      }
    },
    CategoryID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'CategoryID',
      references: {
        model: 'Categories',
        key: 'CategoryID'
      }
    },
    CreatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'CreatedAt'
    }
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'Products',
    timestamps: false
  });
  return Product;
};