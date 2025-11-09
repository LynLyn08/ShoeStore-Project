//backend/models/passwordresettoken.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PasswordResetToken extends Model {
    static associate(models) {
      PasswordResetToken.belongsTo(models.User, { foreignKey: 'UserID', as: 'user' });
    }
  }
  PasswordResetToken.init({
    TokenID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'TokenID'
    },
    UserID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'UserID',
      references: { model: 'Users', key: 'UserID' }
    },
    Token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'Token'
    },
    ExpiryDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'ExpiryDate'
    }
  }, {
    sequelize,
    modelName: 'PasswordResetToken',
    tableName: 'PasswordResetTokens',
    timestamps: false
  });
  return PasswordResetToken;
};