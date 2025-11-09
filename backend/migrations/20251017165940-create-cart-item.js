// backend/migrations/20251017165940-create-cart-item.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CartItems', {
      CartItemID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      CartID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Carts',
          key: 'CartID'
        },
        onDelete: 'CASCADE' // Xóa item nếu giỏ hàng bị xóa
      },
      VariantID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ProductVariants',
          key: 'VariantID'
        },
        onDelete: 'CASCADE' // Xóa item nếu biến thể sản phẩm bị xóa (tùy logic nghiệp vụ)
      },
      Quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      Price: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false
      },
      AddedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('GETDATE')
      }
    });

    // Thêm các check constraint
    await queryInterface.addConstraint('CartItems', {
      fields: ['Quantity'],
      type: 'check',
      where: {
        Quantity: {
          [Sequelize.Op.gt]: 0
        }
      },
      name: 'CK_CartItems_Qty'
    });
    await queryInterface.addConstraint('CartItems', {
      fields: ['Price'],
      type: 'check',
      where: {
        Price: {
          [Sequelize.Op.gte]: 0
        }
      },
      name: 'CK_CartItems_Price'
    });

    // Thêm các index
    await queryInterface.addIndex('CartItems', ['CartID', 'VariantID'], { name: 'IDX_CartItems_Unique', unique: true });
    await queryInterface.addIndex('CartItems', ['CartID'], { name: 'IDX_CartItems_CartID' });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('CartItems');
  }
};