// backend/seeders/20251017175625-demo-auxiliary-data.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // === SỬA LỖI: Cập nhật cấu trúc Coupon ===
      await queryInterface.bulkInsert('Coupons', [{
        Code: 'SHOE20',
        // Xóa: DiscountPercent: 20,
        // Thêm 3 dòng sau:
        DiscountType: 'Percent',
        DiscountValue: 20,
        MinPurchaseAmount: 0, // 0 = Không có đơn tối thiểu
        ExpiryDate: new Date('2025-12-31'),
        MaxUses: 100,
        UsedCount: 0,
        CreatedAt: new Date()
      }], { transaction });
      // === KẾT THÚC SỬA ===

      // --- Lấy thông tin cần thiết (User, Product) ---
      const users = await queryInterface.sequelize.query("SELECT UserID FROM Users WHERE Username = 'user1'", { type: Sequelize.QueryTypes.SELECT, transaction });
      const products = await queryInterface.sequelize.query("SELECT ProductID FROM Products WHERE Name LIKE 'Giày Thể Thao Nam Model 001'", { type: Sequelize.QueryTypes.SELECT, transaction });
      
      if(users.length > 0 && products.length > 0) {
        const userId = users[0].UserID;
        const productId = products[0].ProductID;

        // --- Seed Reviews ---
        await queryInterface.bulkInsert('Reviews', [{
          UserID: userId,
          ProductID: productId,
          Rating: 4,
          Comment: 'Rất tốt, nhưng size hơi chật!',
          CreatedAt: new Date()
        }], { transaction });

        // --- Seed Wishlist ---
        await queryInterface.bulkInsert('Wishlist', [{
          UserID: userId,
          ProductID: productId,
          CreatedAt: new Date()
        }], { transaction });

        // --- Seed PasswordResetTokens ---
        await queryInterface.bulkInsert('PasswordResetTokens', [{
          UserID: userId,
          Token: 'randomtoken123',
          ExpiryDate: new Date(Date.now() + 3600 * 1000) // Hết hạn sau 1 giờ
        }], { transaction });
      }

      // --- Seed Blogs ---
      await queryInterface.bulkInsert('Blogs', [{
        Title: 'Xu hướng giày 2025',
        Content: 'Nội dung về xu hướng giày mới...',
        Author: 'Quản Trị',
        ImageURL: '/images/blog1.jpg',
        IsActive: true,
        CreatedAt: new Date()
      }], { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Blogs', null, {});
    await queryInterface.bulkDelete('PasswordResetTokens', null, {});
    await queryInterface.bulkDelete('Wishlist', null, {});
    await queryInterface.bulkDelete('Reviews', null, {});
    await queryInterface.bulkDelete('Coupons', null, {});
  }
};