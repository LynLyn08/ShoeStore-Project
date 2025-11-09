// backend/migrations/20251017165543-create-product-variant.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProductVariants', {
      VariantID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ProductID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Products',
          key: 'ProductID'
        },
        onDelete: 'CASCADE'
      },
      Size: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      Color: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      StockQuantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      SKU: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: true
      },
      IsActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    });

    // Thêm check constraint cho StockQuantity
    await queryInterface.addConstraint('ProductVariants', {
      fields: ['StockQuantity'],
      type: 'check',
      where: {
        StockQuantity: {
          [Sequelize.Op.gte]: 0
        }
      },
      name: 'CK_ProductVariants_Stock'
    });

    // Thêm các index
    await queryInterface.addIndex('ProductVariants', ['ProductID'], { name: 'IDX_ProductVariants_ProductID' });
    await queryInterface.addIndex('ProductVariants', ['ProductID', 'Size', 'Color'], { name: 'IDX_ProductVariants_Unique', unique: true });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ProductVariants');
  }
};