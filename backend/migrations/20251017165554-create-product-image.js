// backend/migrations/20251017165554-create-product-image.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProductImages', {
      ImageID: {
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
      VariantID: {
        type: Sequelize.INTEGER,
        allowNull: true, // Cho phép NULL
        references: {
          model: 'ProductVariants',
          key: 'VariantID'
        },
        onDelete: 'NO ACTION' // Hoặc SET NULL tùy vào logic
      },
      ImageURL: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      IsDefault: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      CreatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('GETDATE')
      }
    });

    await queryInterface.addIndex('ProductImages', ['ProductID'], { name: 'IDX_ProductImages_ProductID' });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ProductImages');
  }
};