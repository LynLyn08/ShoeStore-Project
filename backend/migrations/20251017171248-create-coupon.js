'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Coupons', {
      CouponID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      Code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      DiscountType: {
        type: Sequelize.ENUM('Percent', 'FixedAmount'),
        allowNull: false,
        defaultValue: 'Percent'
      },
      DiscountValue: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      MinPurchaseAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      ExpiryDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      MaxUses: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      UsedCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      
      // === PHẦN CẦN THÊM ===
      IsPublic: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      UsesPerUser: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      // === KẾT THÚC PHẦN CẦN THÊM ===

      CreatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Coupons');
  }
};