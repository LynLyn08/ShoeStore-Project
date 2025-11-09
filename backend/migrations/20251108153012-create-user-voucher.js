'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserVouchers', {
      UserID: {
        type: Sequelize.INTEGER,
        primaryKey: true, // Thêm khóa chính
        allowNull: false,
        references: {     // Thêm khóa ngoại
          model: 'Users', // Tên bảng Users của bạn
          key: 'UserID'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      CouponID: {
        type: Sequelize.INTEGER,
        primaryKey: true, // Thêm khóa chính
        allowNull: false,
        references: {     // Thêm khóa ngoại
          model: 'Coupons', // Tên bảng Coupons của bạn
          key: 'CouponID'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      IsUsed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: { // Đổi tên từ CreatedAt thành createdAt cho chuẩn
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
      // Chúng ta không cần updatedAt
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserVouchers');
  }
};