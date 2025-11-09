// backend/migrations/20251017170219-create-order-item.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('OrderItems', {
      OrderItemID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      OrderID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Orders', key: 'OrderID' },
        onDelete: 'CASCADE'
      },
      VariantID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ProductVariants', key: 'VariantID' },
        onDelete: 'NO ACTION' // Giữ lại thông tin item dù sản phẩm bị xóa
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
    await queryInterface.addConstraint('OrderItems', {
      fields: ['Quantity'],
      type: 'check',
      where: { Quantity: { [Sequelize.Op.gt]: 0 } },
      name: 'CK_OrderItems_Qty'
    });
    await queryInterface.addConstraint('OrderItems', {
      fields: ['Price'],
      type: 'check',
      where: { Price: { [Sequelize.Op.gte]: 0 } },
      name: 'CK_OrderItems_Price'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('OrderItems');
  }
};