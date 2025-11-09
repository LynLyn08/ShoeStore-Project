// backend/migrations/20251017170446-create-guest-order-item.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('GuestOrderItems', {
      GuestOrderItemID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      GuestOrderID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'GuestOrders', key: 'GuestOrderID' },
        onDelete: 'CASCADE'
      },
      VariantID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ProductVariants', key: 'VariantID' },
        onDelete: 'NO ACTION'
      },
      Quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      Price: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false
      }
    });

    // Thêm Check Constraints
    await queryInterface.addConstraint('GuestOrderItems', {
      fields: ['Quantity'],
      type: 'check',
      where: { Quantity: { [Sequelize.Op.gt]: 0 } },
      name: 'CK_GuestOrderItems_Qty'
    });
    await queryInterface.addConstraint('GuestOrderItems', {
      fields: ['Price'],
      type: 'check',
      where: { Price: { [Sequelize.Op.gte]: 0 } },
      name: 'CK_GuestOrderItems_Price'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('GuestOrderItems');
  }
};