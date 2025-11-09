// backend/migrations/20251017165536-create-product.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Bước 1: Tạo bảng Products nhưng KHÔNG có cột DiscountedPrice
    await queryInterface.createTable('Products', {
      ProductID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      Name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      Description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      Price: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false
      },
      DiscountPercent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0
      },
      CategoryID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Categories',
          key: 'CategoryID'
        },
        onDelete: 'NO ACTION'
      },
      CreatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('GETDATE')
      }
    });

    // Bước 2: Dùng câu lệnh SQL gốc để thêm cột tính toán (Computed Column)
    // Đây là cách làm an toàn và chính xác nhất
    await queryInterface.sequelize.query(`
      ALTER TABLE Products
      ADD DiscountedPrice AS (CASE WHEN DiscountPercent > 0 THEN Price * (1 - DiscountPercent/100.0) ELSE Price END) PERSISTED
    `);

    // Bước 3: Thêm các check constraint và index như cũ
    await queryInterface.addConstraint('Products', {
      fields: ['Price'],
      type: 'check',
      where: {
        Price: {
          [Sequelize.Op.gte]: 0
        }
      },
      name: 'CK_Products_Price'
    });

    await queryInterface.addConstraint('Products', {
      fields: ['DiscountPercent'],
      type: 'check',
      where: {
        [Sequelize.Op.and]: [
          { DiscountPercent: { [Sequelize.Op.gte]: 0 } },
          { DiscountPercent: { [Sequelize.Op.lte]: 100 } }
        ]
      },
      name: 'CK_Products_Discount'
    });
    
    await queryInterface.addIndex('Products', ['Name'], { name: 'IDX_Products_Name' });
},
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Products');
  }
};