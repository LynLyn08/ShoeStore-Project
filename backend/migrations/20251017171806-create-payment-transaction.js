//backend/migrations/20251017171806-create-payment-transaction.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PaymentTransactions', {
      PaymentTxnID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      MethodID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'PaymentMethods', key: 'MethodID' }
      },
      OrderID: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Orders', key: 'OrderID' }
      },
      GuestOrderID: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'GuestOrders', key: 'GuestOrderID' }
      },
      Amount: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false
      },
      Currency: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'VND'
      },
      Status: {
        type: Sequelize.ENUM('Pending', 'Authorized', 'Paid', 'Failed', 'Canceled', 'Refunded'),
        allowNull: false,
        defaultValue: 'Pending'
      },
      MerchantRef: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true
      },
      GatewayTxnNo: {
        type: Sequelize.STRING(64),
        allowNull: true
      },
      BankCode: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      CardType: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      PayTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      ClientIP: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      GatewayCode: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      Message: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      RawReturn: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      RawIPN: {
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
      },
      PaidAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    await queryInterface.addConstraint('PaymentTransactions', {
        fields: ['OrderID', 'GuestOrderID'],
        type: 'check',
        name: 'CK_PayTx_OrderXorGuest',
        where: Sequelize.literal(`([OrderID] IS NOT NULL AND [GuestOrderID] IS NULL) OR ([OrderID] IS NULL AND [GuestOrderID] IS NOT NULL)`)
    });

    await queryInterface.addIndex('PaymentTransactions', ['OrderID'], { name: 'IX_PayTx_Order', where: { OrderID: { [Sequelize.Op.ne]: null } } });
    await queryInterface.addIndex('PaymentTransactions', ['GuestOrderID'], { name: 'IX_PayTx_GOrder', where: { GuestOrderID: { [Sequelize.Op.ne]: null } } });
    await queryInterface.addIndex('PaymentTransactions', ['Status'], { name: 'IX_PayTx_Status' });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PaymentTransactions');
  }
};