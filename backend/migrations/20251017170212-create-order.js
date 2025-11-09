// backend/migrations/20251017170212-create-order.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Orders', {
      OrderID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      UserID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'UserID' },
        onDelete: 'CASCADE'
      },
      ShippingAddressID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Addresses', key: 'AddressID' },
        onDelete: 'NO ACTION' // Không xóa order nếu địa chỉ bị xóa
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
      TrackingCode: {
        type: Sequelize.STRING(100),
        allowNull: true
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
      }
    });
    
    // Thêm Check Constraint
    await queryInterface.addConstraint('Orders', {
      fields: ['TotalAmount'],
      type: 'check',
      where: { TotalAmount: { [Sequelize.Op.gte]: 0 } },
      name: 'CK_Orders_Total'
    });

    // Thêm các Index
    await queryInterface.addIndex('Orders', ['UserID'], { name: 'IDX_Orders_User' });
    await queryInterface.addIndex('Orders', ['Status'], { name: 'IDX_Orders_Status' });
    await queryInterface.addIndex('Orders', ['OrderDate'], { name: 'IDX_Orders_Date' });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Orders');
  }
};