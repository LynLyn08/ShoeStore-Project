//backend/migrations/20251017171633-create-payment-method.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PaymentMethods', {
      MethodID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      Code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      Name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      Type: {
        type: Sequelize.ENUM('OFFLINE', 'ONLINE'),
        allowNull: false
      },
      Provider: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      IsActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      ConfigJson: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      CreatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('GETDATE')
      },
      UpdatedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PaymentMethods');
  }
};