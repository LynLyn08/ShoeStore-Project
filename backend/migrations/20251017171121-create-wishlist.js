//backend/migrations/20251017171121-create-wishlist.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Wishlist', {
      WishlistID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      UserID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'UserID' },
        onDelete: 'CASCADE'
      },
      ProductID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Products', key: 'ProductID' },
        onDelete: 'NO ACTION'
      },
      CreatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('GETDATE')
      }
    });

    await queryInterface.addIndex('Wishlist', ['UserID', 'ProductID'], {
        name: 'UX_Wishlist_User_Product',
        unique: true
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Wishlist');
  }
};