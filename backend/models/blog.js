//backend/models/blog.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Blog extends Model {
    static associate(models) {
      // associations can be defined here
    }
  }
  Blog.init({
    BlogID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'BlogID'
    },
    Title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'Title'
    },
    Content: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'Content'
    },
    Author: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'Author'
    },
    ImageURL: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'ImageURL'
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
    modelName: 'Blog',
    tableName: 'Blogs',
    timestamps: false
  });
  return Blog;
};