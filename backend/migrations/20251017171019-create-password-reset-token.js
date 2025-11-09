//backend/migrations/20251017171019-create-password-reset-token.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PasswordResetTokens', {
      TokenID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      UserID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'UserID' },
        onDelete: 'NO ACTION'
      },
      Token: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      ExpiryDate: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PasswordResetTokens');
  }
};