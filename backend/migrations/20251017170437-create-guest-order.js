// backend/migrations/20251017170437-create-guest-order.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('GuestOrders', {
      GuestOrderID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      Email: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      FullName: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      Phone: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      Address: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      TotalAmount: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false
      },
      ShippingFee: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      },
      CouponCode: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      Status: {
        type: Sequelize.ENUM('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'),
        allowNull: false,
        defaultValue: 'Pending'
      },
      ShippingProvider: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      OrderDate: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('GETDATE')
      },
      PaymentMethod: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'COD'
      },
      PaymentStatus: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'Pending'
      },
      PaymentTxnRef: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      PaidAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      UserID: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'UserID' },
        onDelete: 'SET NULL' // Quan trọng
      }
    });

    // Thêm check constraint
    await queryInterface.addConstraint('GuestOrders', {
      fields: ['TotalAmount'],
      type: 'check',
      where: { TotalAmount: { [Sequelize.Op.gte]: 0 } },
      name: 'CK_GuestOrders_Total'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('GuestOrders');
  }
};