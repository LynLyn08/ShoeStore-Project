// backend/migrations/20251017171457-create-usage-log.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UsageLog', {
      UsageID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      CouponID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Coupons', key: 'CouponID' }
        // No onDelete, defaults to NO ACTION
      },
      UserID: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'UserID' }
        // No onDelete, defaults to NO ACTION
      },
      OrderID: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Orders', key: 'OrderID' }
        // No onDelete, defaults to NO ACTION
      },
      GuestOrderID: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'GuestOrders', key: 'GuestOrderID' }
        // No onDelete, defaults to NO ACTION
      },
      UsedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('GETDATE')
      }
    });

    await queryInterface.addIndex('UsageLog', ['CouponID', 'UsedAt'], {
      name: 'IDX_UsageLog_Coupon'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UsageLog');
  }
};