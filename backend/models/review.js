'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    static associate(models) {
      Review.belongsTo(models.User, { foreignKey: 'UserID', as: 'user' });
      Review.belongsTo(models.Product, { foreignKey: 'ProductID', as: 'product' });
      
      // === THÊM DÒNG NÀY ===
      // Một Review (đánh giá) có thể có nhiều Media (ảnh/video)
      Review.hasMany(models.ReviewMedia, { foreignKey: 'ReviewID', as: 'media' });
      // === KẾT THÚC THÊM ===
    }
  }
  Review.init({
    ReviewID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'ReviewID'
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
    Rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
      field: 'Rating'
    },
    Comment: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'Comment'
    },
    CreatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'CreatedAt'
    }
  }, {
    sequelize,
    modelName: 'Review',
    tableName: 'Reviews',
    timestamps: false,
    indexes: [
        {
          unique: true,
          fields: ['UserID', 'ProductID']
        }
    ]
  });
  return Review;
};