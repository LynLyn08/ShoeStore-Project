//backend/migrations/20251017172049-create-shipping-provider.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ShippingProviders', {
      ProviderID: {
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
    await queryInterface.dropTable('ShippingProviders');
  }
};