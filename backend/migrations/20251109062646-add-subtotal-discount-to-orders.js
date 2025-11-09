'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Bắt đầu một transaction
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Thêm 3 cột cho bảng Orders
      await queryInterface.addColumn('Orders', 'Subtotal', {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      }, { transaction });

      // GHI CHÚ: File order.js của bạn đã có ShippingFee,
      // nhưng nếu guestorder.js chưa có thì bạn thêm ở đây.
      // Chúng ta sẽ giả định cả 2 đều cần DiscountAmount
      
      await queryInterface.addColumn('Orders', 'DiscountAmount', {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      }, { transaction });

      // Thêm 3 cột cho bảng GuestOrders
      await queryInterface.addColumn('GuestOrders', 'Subtotal', {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      }, { transaction });
      
      await queryInterface.addColumn('GuestOrders', 'DiscountAmount', {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true
      }, { transaction });

      // Commit transaction
      await transaction.commit();
    } catch (err) {
      // Rollback nếu có lỗi
      await transaction.rollback();
      throw err;
    }
  },
  down: async (queryInterface, Sequelize) => {
    // Bắt đầu một transaction
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Xóa cột khỏi bảng Orders
      await queryInterface.removeColumn('Orders', 'Subtotal', { transaction });
      await queryInterface.removeColumn('Orders', 'DiscountAmount', { transaction });
      
      // Xóa cột khỏi bảng GuestOrders
      await queryInterface.removeColumn('GuestOrders', 'Subtotal', { transaction });
      await queryInterface.removeColumn('GuestOrders', 'DiscountAmount', { transaction });
      
      // Commit
      await transaction.commit();
    } catch (err) {
      // Rollback
      await transaction.rollback();
      throw err;
    }
  }
};