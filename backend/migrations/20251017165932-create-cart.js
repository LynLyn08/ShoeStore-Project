// backend/migrations/20251017165932-create-cart.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Carts', {
      CartID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      UserID: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'UserID'
        },
        onDelete: 'SET NULL' // Nếu user bị xóa, UserID trong giỏ hàng sẽ thành NULL
      },
      SessionID: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      TotalItems: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      CreatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('GETDATE')
      },
      UpdatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('GETDATE')
      }
    });

    // Tạo unique index cho SessionID khi không NULL
    await queryInterface.addIndex('Carts', ['SessionID'], {
      name: 'UX_Carts_SessionID_NotNull',
      unique: true,
      where: {
        SessionID: {
          [Sequelize.Op.ne]: null
        }
      }
    });

    // Tạo unique index cho UserID khi không NULL
    await queryInterface.addIndex('Carts', ['UserID'], {
      name: 'UX_Carts_UserID_NotNull',
      unique: true,
      where: {
        UserID: {
          [Sequelize.Op.ne]: null
        }
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Carts');
  }
};