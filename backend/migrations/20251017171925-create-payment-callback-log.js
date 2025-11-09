//backend/migrations/20251017171925-create-payment-callback-log.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PaymentCallbackLog', {
      LogID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      PaymentTxnID: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: 'PaymentTransactions', key: 'PaymentTxnID' }
      },
      Channel: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      QueryString: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      ReceivedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('GETDATE')
      },
      RemoteIP: {
        type: Sequelize.STRING(45),
        allowNull: true
      }
    });

    await queryInterface.addIndex('PaymentCallbackLog', ['PaymentTxnID'], { name: 'IX_PayCb_Txn' });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PaymentCallbackLog');
  }
};